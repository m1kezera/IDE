import re

with open(r'C:\pulsyce\docs\patches\front\codigo_fonte_frontend_v2.4.4.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the App.jsx section
match = re.search(r'### `frontend/src/App\.jsx`\s*```(?:\w+)?\n(.*?)```', content, re.DOTALL)
if match:
    code = match.group(1)
    with open(r'c:\pulsyce\frontend\src\App.jsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print(f'Successfully restored App.jsx! ({len(code.splitlines())} lines)')
else:
    print('Failed to find App.jsx in docs.')
