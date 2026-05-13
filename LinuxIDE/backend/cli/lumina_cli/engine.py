import os
import json
import subprocess
from anthropic import Anthropic

TOOLS = [
    {
        "name": "bash",
        "description": "Execute a bash command in the current working directory.",
        "input_schema": {
            "type": "object",
            "properties": {
                "command": {"type": "string", "description": "The bash command to execute"}
            },
            "required": ["command"]
        }
    },
    {
        "name": "read_file",
        "description": "Read the contents of a file.",
        "input_schema": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string", "description": "Absolute or relative path to the file"}
            },
            "required": ["file_path"]
        }
    },
    {
        "name": "write_file",
        "description": "Write or overwrite a file entirely.",
        "input_schema": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string"},
                "content": {"type": "string"}
            },
            "required": ["file_path", "content"]
        }
    }
]

def execute_tool(name: str, arguments: dict):
    if name == "bash":
        cmd = arguments.get("command", "")
        try:
            result = subprocess.run(cmd, shell=True, cwd=os.getcwd(), capture_output=True, text=True, timeout=120)
            return {"status": "ok", "stdout": result.stdout, "stderr": result.stderr, "exit_code": result.returncode}
        except Exception as e:
            return {"status": "error", "error": str(e)}
            
    elif name == "read_file":
        path = arguments.get("file_path")
        try:
            with open(path, "r", encoding="utf-8") as f:
                return {"status": "ok", "content": f.read()}
        except Exception as e:
            return {"status": "error", "error": str(e)}
            
    elif name == "write_file":
        path = arguments.get("file_path")
        content = arguments.get("content")
        try:
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            return {"status": "ok"}
        except Exception as e:
            return {"status": "error", "error": str(e)}
            
    return {"status": "error", "error": f"Unknown tool: {name}"}
