from setuptools import setup, find_packages

setup(
    name='lumina-cli',
    version='1.0.0',
    packages=find_packages(),
    install_requires=[
        'httpx',
        'rich',
        'prompt_toolkit',
        'psutil',
        'textual',
    ],
    entry_points={
        'console_scripts': [
            'lumina=lumina_cli.main:main',
        ],
    },
    author='Lumina IDE',
    description='Standalone CLI for Lumina God Mode Engine (Claude Code style)',
)
