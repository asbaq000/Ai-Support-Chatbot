"""Build a no-install HTML preview and a clean deliverable ZIP after npm run build."""
from pathlib import Path
import re
import zipfile

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / 'frontend' / 'build'
PORTFOLIO = ROOT / 'portfolio'
PORTFOLIO.mkdir(exist_ok=True)
page = (BUILD / 'index.html').read_text(encoding='utf-8')
inline_scripts = []
def css(match):
    path = BUILD / match.group(1).removeprefix('./').removeprefix('/')
    return '<style>' + path.read_text(encoding='utf-8') + '</style>'
def js(match):
    path = BUILD / match.group(1).removeprefix('./').removeprefix('/')
    code = path.read_text(encoding='utf-8').replace('</script', '<\\/script')
    inline_scripts.append(code)
    return ''
page = re.sub(r'<link href="([^"]+\.css)" rel="stylesheet">', css, page)
page = re.sub(r'<script defer="defer" src="([^"]+)"></script>', js, page)
page = re.sub(r'<link[^>]+(?:fonts\.googleapis|fonts\.gstatic|manifest\.json)[^>]*>', '', page)
page = re.sub(r'<link rel="icon"[^>]*>', '', page)
page = page.replace('<head>', '<head><script>window.__ASSISTLY_PREVIEW__ = true;</script>')
page = page.replace('</body>', '<script>' + '\n'.join(inline_scripts) + '</script></body>')
(PORTFOLIO / 'preview.html').write_text(page, encoding='utf-8')

archive = ROOT / 'Assistly-Fiverr-Portfolio.zip'
excluded = {'node_modules', '.npm-cache', '.git', '.browser-session', '.venv', '__pycache__', '.agents', '.codex'}
files = []
for folder in ('frontend', 'portfolio', 'tests', 'scripts'):
    for path in (ROOT / folder).rglob('*'):
        if path.is_file() and not any(part in excluded for part in path.relative_to(ROOT).parts):
            if path.name in {'.env', '.env.local'} or path.name.endswith('.map'):
                continue
            files.append(path)
files += [ROOT / name for name in ('app.py', 'requirements.txt', 'README.md', '.env.example', '.gitignore')]
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as bundle:
    for path in sorted(files):
        bundle.write(path, path.relative_to(ROOT).as_posix())
print(f'Preview: {PORTFOLIO / "preview.html"}')
print(f'Package: {archive} ({archive.stat().st_size:,} bytes, {len(files)} files)')
