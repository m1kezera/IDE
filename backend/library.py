import os
import json
import logging
import asyncio
from typing import List, Dict, Optional
from datetime import datetime

_fitz = None
try:
    import fitz as _fitz  # PyMuPDF
except ImportError:
    pass

_docx = None
try:
    import docx as _docx  # python-docx
except ImportError:
    pass

from brain import brain
from database import get_session_direct
from sqlmodel import select

log = logging.getLogger("projecty")


class ProjectYLibrary:
    """O Bibliotecário da Project Y: Processa documentos e os envia para a memória persistente.
    
    v2.0: All state stored in SQLite (pulsyce.db) instead of flat JSON files.
    """

    def __init__(self):
        self.indexing_queue = []
        self.is_processing = False

    # ── Folder Operations ────────────────────────────────────────

    def create_folder(self, name: str) -> Dict:
        """Create a new library folder."""
        from models import LibraryFolder
        with get_session_direct() as session:
            existing = session.exec(select(LibraryFolder).where(LibraryFolder.name == name)).first()
            if existing:
                return {"name": existing.name}
            folder = LibraryFolder(name=name)
            session.add(folder)
            session.commit()
            log.info(f"📁 Pasta criada na biblioteca: {name}")
            return {"name": name}

    def get_folders(self) -> List[Dict]:
        """Return all library folders with document counts."""
        from models import LibraryFolder, LibraryDocument
        with get_session_direct() as session:
            folders = session.exec(select(LibraryFolder)).all()
            result = []
            for f in folders:
                doc_count = len(session.exec(
                    select(LibraryDocument).where(LibraryDocument.folder == f.name)
                ).all())
                result.append({"name": f.name, "doc_count": doc_count})
            return result

    def move_to_folder(self, doc_name: str, folder_name: str) -> bool:
        """Move a document to a specific folder."""
        from models import LibraryDocument, LibraryFolder
        with get_session_direct() as session:
            doc = session.exec(select(LibraryDocument).where(LibraryDocument.name == doc_name)).first()
            if not doc:
                return False
            # Ensure folder exists
            folder = session.exec(select(LibraryFolder).where(LibraryFolder.name == folder_name)).first()
            if not folder:
                session.add(LibraryFolder(name=folder_name))
            doc.folder = folder_name
            session.commit()
            log.info(f"📂 Documento '{doc_name}' movido para pasta '{folder_name}'")
            return True

    def delete_folder(self, folder_name: str) -> bool:
        """Delete a folder. Moves all docs back to 'Geral'."""
        if folder_name == "Geral":
            return False
        from models import LibraryFolder, LibraryDocument
        with get_session_direct() as session:
            folder = session.exec(select(LibraryFolder).where(LibraryFolder.name == folder_name)).first()
            if not folder:
                return False
            # Move all docs to "Geral"
            docs = session.exec(select(LibraryDocument).where(LibraryDocument.folder == folder_name)).all()
            for doc in docs:
                doc.folder = "Geral"
            session.delete(folder)
            session.commit()
            log.info(f"🗑️ Pasta removida da biblioteca: {folder_name}")
            return True

    def rename_folder(self, old_name: str, new_name: str) -> bool:
        """Rename a folder."""
        if old_name == "Geral" or not new_name:
            return False
        from models import LibraryFolder, LibraryDocument
        with get_session_direct() as session:
            folder = session.exec(select(LibraryFolder).where(LibraryFolder.name == old_name)).first()
            if not folder:
                return False
            existing = session.exec(select(LibraryFolder).where(LibraryFolder.name == new_name)).first()
            if existing:
                return False
            # Update docs
            docs = session.exec(select(LibraryDocument).where(LibraryDocument.folder == old_name)).all()
            for doc in docs:
                doc.folder = new_name
            folder.name = new_name
            session.commit()
            log.info(f"📝 Pasta renomeada: '{old_name}' → '{new_name}'")
            return True

    # ── Document Operations ──────────────────────────────────────

    def remove_document(self, doc_name: str) -> bool:
        """Remove a document from the library registry."""
        from models import LibraryDocument
        with get_session_direct() as session:
            doc = session.exec(select(LibraryDocument).where(LibraryDocument.name == doc_name)).first()
            if not doc:
                return False
            session.delete(doc)
            session.commit()
            log.info(f"🗑️ Documento removido da biblioteca: {doc_name}")
            return True

    def _register_doc(self, session, name: str, path: str, doc_type: str,
                      pages: int = 0, words: int = 0, tables: int = 0) -> None:
        """Register a document in SQLite (upsert)."""
        from models import LibraryDocument
        existing = session.exec(select(LibraryDocument).where(LibraryDocument.name == name)).first()
        if not existing:
            session.add(LibraryDocument(
                name=name, path=path, doc_type=doc_type,
                folder="Geral", pages=pages, words=words, tables_count=tables,
            ))

    async def process_pdf(self, file_path: str):
        """Extrai texto de um PDF e o indexa no Brain com metadados ricos."""
        if _fitz is None:
            log.warning("⚠️ PyMuPDF não disponível — PDF não processado")
            return False
        if not os.path.exists(file_path):
            log.error(f"❌ Arquivo não encontrado: {file_path}")
            return False

        file_name = os.path.basename(file_path)
        log.info(f"📚 Processando PDF: {file_name}")

        try:
            doc = _fitz.open(file_path)
            total_pages = len(doc)
            full_text = f"[DOCUMENTO: {file_name} | Páginas: {total_pages}]\n\n"
            word_count = 0

            for page_num in range(total_pages):
                page = doc.load_page(page_num)
                text = page.get_text("text")
                if text.strip():
                    words = len(text.split())
                    word_count += words
                    full_text += f"\n{'='*60}\n"
                    full_text += f"[Página {page_num + 1}/{total_pages}] ({words} palavras)\n"
                    full_text += f"{'='*60}\n{text}\n"

            if full_text.strip():
                await brain.index_code(
                    file_path=file_path,
                    content=full_text,
                    source_type="documentation",
                    tag="[DOC]"
                )
                with get_session_direct() as session:
                    self._register_doc(session, file_name, file_path, "pdf",
                                       pages=total_pages, words=word_count)
                    session.commit()

                log.info(f"✅ PDF '{file_name}' processado ({total_pages} pgs, {word_count} palavras)")
                return True
            else:
                log.warning(f"⚠️ PDF '{file_name}' não contém texto extraível.")
                return False
        except Exception as e:
            log.error(f"❌ Erro ao processar PDF {file_name}: {e}")
            return False
        finally:
            if 'doc' in locals():
                doc.close()

    async def process_docx(self, file_path: str):
        """Extrai texto de um arquivo Word (.docx) e o indexa no Brain."""
        if _docx is None:
            log.warning("⚠️ python-docx não disponível — DOCX não processado")
            return False
        if not os.path.exists(file_path):
            log.error(f"❌ Arquivo não encontrado: {file_path}")
            return False

        file_name = os.path.basename(file_path)
        log.info(f"📄 Processando DOCX: {file_name}")

        try:
            doc = _docx.Document(file_path)
            full_text = f"[DOCUMENTO: {file_name} | Tipo: Word DOCX]\n\n"
            word_count = 0

            for para in doc.paragraphs:
                text = para.text.strip()
                if not text:
                    continue
                style = para.style.name if para.style else 'Normal'
                words = len(text.split())
                word_count += words
                if 'Heading' in style or 'Title' in style:
                    level = ''.join(filter(str.isdigit, style)) or '1'
                    prefix = '#' * int(level)
                    full_text += f"\n{prefix} {text}\n"
                else:
                    full_text += f"{text}\n"

            for i, table in enumerate(doc.tables):
                full_text += f"\n[Tabela {i+1}]\n"
                for row in table.rows:
                    cells = [cell.text.strip() for cell in row.cells]
                    full_text += " | ".join(cells) + "\n"
                    word_count += sum(len(c.split()) for c in cells)

            if full_text.strip():
                await brain.index_code(
                    file_path=file_path,
                    content=full_text,
                    source_type="documentation",
                    tag="[DOC]"
                )
                with get_session_direct() as session:
                    self._register_doc(session, file_name, file_path, "docx",
                                       words=word_count, tables=len(doc.tables))
                    session.commit()

                log.info(f"✅ DOCX '{file_name}' processado ({word_count} palavras, {len(doc.tables)} tabelas)")
                return True
            else:
                log.warning(f"⚠️ DOCX '{file_name}' está vazio.")
                return False
        except Exception as e:
            log.error(f"❌ Erro ao processar DOCX {file_name}: {e}")
            return False

    async def process_markdown(self, file_path: str):
        """Processa arquivos Markdown ou Texto."""
        if not os.path.exists(file_path):
            return False

        file_name = os.path.basename(file_path)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            if content.strip():
                await brain.index_code(
                    file_path=file_path,
                    content=content,
                    source_type="documentation",
                    tag="[DOC]"
                )
                with get_session_direct() as session:
                    doc_type = "md" if file_path.endswith('.md') else "txt"
                    self._register_doc(session, file_name, file_path, doc_type)
                    session.commit()
                return True
        except Exception as e:
            log.error(f"❌ Erro ao processar doc {file_name}: {e}")
            return False
        return False

    def get_documents(self) -> List[Dict]:
        """Retorna lista de documentos na biblioteca."""
        from models import LibraryDocument
        with get_session_direct() as session:
            docs = session.exec(select(LibraryDocument)).all()
            return [{
                "name": d.name,
                "path": d.path,
                "type": d.doc_type,
                "folder": d.folder,
                "pages": d.pages,
                "words": d.words,
                "tables": d.tables_count,
            } for d in docs]

    # ── Personality Prompt ────────────────────────────────────────

    def set_personality(self, text: str, name: str = "personality.txt") -> bool:
        """Set a custom system prompt that prepends to all LLM interactions."""
        from models import PersonalityConfig
        with get_session_direct() as session:
            p = session.exec(select(PersonalityConfig)).first()
            if not p:
                p = PersonalityConfig(name=name, prompt=text.strip(), is_active=True)
                session.add(p)
            else:
                p.prompt = text.strip()
                p.name = name
                p.is_active = True
                p.updated_at = datetime.utcnow()
            session.commit()
            log.info(f"🧠 Personality prompt set: '{name}' ({len(text.strip())} chars)")
            return True

    def get_personality(self) -> Dict:
        """Get the current personality prompt."""
        from models import PersonalityConfig
        with get_session_direct() as session:
            p = session.exec(select(PersonalityConfig).where(PersonalityConfig.is_active == True)).first()
            if p:
                return {
                    "active": True,
                    "name": p.name,
                    "text": p.prompt,
                    "char_count": len(p.prompt),
                }
            return {
                "active": False,
                "name": "",
                "text": "",
                "char_count": 0,
            }

    def clear_personality(self) -> bool:
        """Remove the personality prompt."""
        from models import PersonalityConfig
        with get_session_direct() as session:
            p = session.exec(select(PersonalityConfig)).first()
            if p:
                p.prompt = ""
                p.name = ""
                p.is_active = False
                session.commit()
            log.info("🧠 Personality prompt cleared")
            return True

    def get_personality_chunked(self, max_tokens: int = 2048) -> str:
        """Return personality prompt truncated to max_tokens using tiktoken.
        For small models with limited context windows."""
        personality = self.get_personality()
        prompt = personality.get("text", "")
        if not prompt:
            return ""

        try:
            from chunker import _encoding
            tokens = _encoding.encode(prompt)
            if len(tokens) <= max_tokens:
                return prompt

            truncated_tokens = tokens[:max_tokens]
            truncated_text = _encoding.decode(truncated_tokens)
            log.info(f"🧠 Personality truncated: {len(tokens)} → {max_tokens} tokens")
            return truncated_text + "\n[...personality prompt truncated for model context limit...]"
        except Exception:
            max_chars = max_tokens * 4
            if len(prompt) <= max_chars:
                return prompt
            return prompt[:max_chars] + "\n[...truncated...]"

    # ── Document Content Injection (v10.1) ────────────────────────

    def _read_file_content(self, file_path: str) -> str:
        """Read document content from disk using appropriate parser.
        
        Supports PDF (PyMuPDF), DOCX (python-docx), and plaintext (MD/TXT).
        Returns formatted text with page/section markers for citation.
        """
        if not os.path.exists(file_path):
            return ""

        ext = os.path.splitext(file_path)[1].lower()
        file_name = os.path.basename(file_path)

        try:
            # PDF
            if ext == ".pdf" and _fitz is not None:
                doc = _fitz.open(file_path)
                parts = []
                for page_num in range(len(doc)):
                    page = doc.load_page(page_num)
                    text = page.get_text("text").strip()
                    if text:
                        parts.append(f"[Página {page_num + 1}]\n{text}")
                doc.close()
                return "\n\n".join(parts)

            # DOCX
            elif ext == ".docx" and _docx is not None:
                doc = _docx.Document(file_path)
                parts = []
                for para in doc.paragraphs:
                    text = para.text.strip()
                    if text:
                        style = para.style.name if para.style else "Normal"
                        if "Heading" in style or "Title" in style:
                            level = ''.join(filter(str.isdigit, style)) or '1'
                            prefix = '#' * int(level)
                            parts.append(f"{prefix} {text}")
                        else:
                            parts.append(text)
                # Tables
                for i, table in enumerate(doc.tables):
                    rows = []
                    for row in table.rows:
                        cells = [cell.text.strip() for cell in row.cells]
                        rows.append(" | ".join(cells))
                    parts.append(f"\n[Tabela {i+1}]\n" + "\n".join(rows))
                return "\n".join(parts)

            # Plaintext (MD, TXT, etc.)
            else:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    return f.read()

        except Exception as e:
            log.warning(f"⚠️ Failed to read {file_name}: {e}")
            return ""

    def get_all_content_for_injection(self, max_tokens: int = 8000) -> str:
        """Return all library document content formatted for prompt injection.
        
        Reads stored documents from disk and formats with source metadata
        for citation. Respects token budget with per-document fair distribution.
        
        Args:
            max_tokens: Maximum total tokens for all document content combined.
            
        Returns:
            Formatted string with document headers and content ready for
            system prompt injection with citation markers.
        """
        docs = self.get_documents()
        if not docs:
            return ""

        # Calculate per-document budget
        per_doc_budget = max(1000, max_tokens // max(len(docs), 1))

        try:
            from chunker import _encoding
            use_tiktoken = True
        except Exception:
            _encoding = None
            use_tiktoken = False

        sections = []
        total_tokens = 0
        loaded_docs = []

        for doc_info in docs:
            if total_tokens >= max_tokens:
                break

            file_path = doc_info.get("path", "")
            doc_name = doc_info.get("name", "unknown")
            doc_type = doc_info.get("type", "txt")
            pages = doc_info.get("pages", 0)
            words = doc_info.get("words", 0)

            content = self._read_file_content(file_path)
            if not content:
                continue

            # Truncate content to per-document budget
            if use_tiktoken:
                tokens = _encoding.encode(content)
                remaining_budget = max_tokens - total_tokens
                doc_budget = min(per_doc_budget, remaining_budget)
                if len(tokens) > doc_budget:
                    content = _encoding.decode(tokens[:doc_budget])
                    content += f"\n[...documento truncado, {len(tokens) - doc_budget} tokens restantes...]"
                doc_tokens = min(len(tokens), doc_budget)
            else:
                max_chars = per_doc_budget * 4
                remaining_chars = (max_tokens - total_tokens) * 4
                doc_max = min(max_chars, remaining_chars)
                if len(content) > doc_max:
                    content = content[:doc_max]
                    content += "\n[...documento truncado...]"
                doc_tokens = len(content) // 4  # rough estimate

            # Build section with citation header
            meta_parts = [doc_type.upper()]
            if pages:
                meta_parts.append(f"{pages} págs")
            if words:
                meta_parts.append(f"{words} palavras")
            meta_str = " · ".join(meta_parts)

            section = f"\n{'═' * 60}\n"
            section += f"📄 DOCUMENTO: {doc_name} ({meta_str})\n"
            section += f"   Cite como: [Fonte: {doc_name}]\n"
            section += f"{'═' * 60}\n"
            section += content
            sections.append(section)

            total_tokens += doc_tokens
            loaded_docs.append(doc_name)

        if not sections:
            return ""

        header = f"\n\n═══ BIBLIOTECA — {len(loaded_docs)} DOCUMENTO(S) CARREGADO(S) ═══\n"
        header += f"Documentos: {', '.join(loaded_docs)}\n"
        result = header + "\n".join(sections) + "\n═══ FIM DA BIBLIOTECA ═══\n"

        log.info(f"📚 [LibraryInject] Injected {len(loaded_docs)} docs, ~{total_tokens} tokens")
        return result

    def get_document_list_summary(self) -> str:
        """Return a compact summary of available library documents.
        
        Used in the citation header so the model knows what's available.
        """
        docs = self.get_documents()
        if not docs:
            return "Nenhum documento na biblioteca."

        lines = []
        for doc_info in docs:
            name = doc_info.get("name", "?")
            dtype = doc_info.get("type", "?").upper()
            pages = doc_info.get("pages", 0)
            words = doc_info.get("words", 0)
            parts = [f"• {name} ({dtype})"]
            if pages:
                parts[0] += f" — {pages} páginas"
            if words:
                parts[0] += f", {words} palavras"
            lines.append(parts[0])

        return "\n".join(lines)

    def search_by_keywords(self, query: str, max_results: int = 3, max_chars_per_result: int = 2000) -> List[Dict]:
        """Keyword-based search through library document contents.
        
        Fallback search when Brain vector search is unavailable.
        Scores documents by keyword overlap with the query, then
        extracts the most relevant passages.
        
        Args:
            query: Search query from the user
            max_results: Maximum number of document snippets to return
            max_chars_per_result: Maximum characters per snippet
            
        Returns:
            List of dicts with 'content', 'file', 'doc_name', 'score'
        """
        docs = self.get_documents()
        if not docs:
            return []

        query_words = set(query.lower().split())
        # Remove stopwords (PT + EN)
        stopwords = {"de", "da", "do", "em", "no", "na", "o", "a", "os", "as", "um", "uma",
                      "e", "ou", "que", "com", "para", "por", "se", "não", "como",
                      "the", "a", "an", "in", "on", "of", "to", "and", "or", "is", "it",
                      "for", "with", "this", "that", "from", "what", "how", "are"}
        query_words -= stopwords

        if not query_words:
            return []

        scored_passages = []

        for doc_info in docs:
            file_path = doc_info.get("path", "")
            doc_name = doc_info.get("name", "unknown")

            content = self._read_file_content(file_path)
            if not content:
                continue

            # Split into paragraphs/chunks for granular results
            paragraphs = [p.strip() for p in content.split("\n\n") if len(p.strip()) > 50]
            if not paragraphs:
                paragraphs = [content[i:i+500] for i in range(0, len(content), 400)]

            for para in paragraphs:
                para_words = set(para.lower().split())
                overlap = len(query_words & para_words)
                if overlap > 0:
                    # Boost score by match density
                    density = overlap / max(len(para_words), 1)
                    score = overlap + (density * 5)
                    scored_passages.append({
                        "content": para[:max_chars_per_result],
                        "file": file_path,
                        "doc_name": doc_name,
                        "score": score,
                    })

        # Sort by score descending
        scored_passages.sort(key=lambda x: -x["score"])
        results = scored_passages[:max_results]

        if results:
            log.info(f"📚 [KeywordSearch] Found {len(results)} passages for query: {query[:50]}...")

        return results


# Singleton
library = ProjectYLibrary()
