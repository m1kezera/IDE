# Lumina IDE - Code Dump (frontend)

## index.html

```html
<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/png" href="/Luminalogo.png" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lumina IDE</title>
  <meta name="description"
    content="Lumina IDE — Local Intelligence, Global Performance. Ambiente de codificação híbrido com IA local." />
</head>

<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>

</html>
```

## package-lock.json

```json
{
  "name": "frontend",
  "version": "0.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "frontend",
      "version": "0.0.0",
      "dependencies": {
        "react": "^19.2.4",
        "react-dom": "^19.2.4"
      },
      "devDependencies": {
        "@tailwindcss/vite": "^4.2.1",
        "@types/react": "^19.2.14",
        "@types/react-dom": "^19.2.3",
        "@vitejs/plugin-react": "^5.1.4",
        "tailwindcss": "^4.2.1",
        "typescript": "~5.9.3",
        "vite": "^7.3.1"
      }
    },
    "node_modules/@babel/code-frame": {
      "version": "7.29.0",
      "resolved": "https://registry.npmjs.org/@babel/code-frame/-/code-frame-7.29.0.tgz",
      "integrity": "sha512-9NhCeYjq9+3uxgdtp20LSiJXJvN0FeCtNGpJxuMFZ1Kv3cWUNb6DOhJwUvcVCzKGR66cw4njwM6hrJLqgOwbcw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-validator-identifier": "^7.28.5",
        "js-tokens": "^4.0.0",
        "picocolors": "^1.1.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/compat-data": {
      "version": "7.29.0",
      "resolved": "https://registry.npmjs.org/@babel/compat-data/-/compat-data-7.29.0.tgz",
      "integrity": "sha512-T1NCJqT/j9+cn8fvkt7jtwbLBfLC/1y1c7NtCeXFRgzGTsafi68MRv8yzkYSapBnFA6L3U2VSc02ciDzoAJhJg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/core": {
      "version": "7.29.0",
      "resolved": "https://registry.npmjs.org/@babel/core/-/core-7.29.0.tgz",
      "integrity": "sha512-CGOfOJqWjg2qW/Mb6zNsDm+u5vFQ8DxXfbM09z69p5Z6+mE1ikP2jUXw+j42Pf1XTYED2Rni5f95npYeuwMDQA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.29.0",
        "@babel/generator": "^7.29.0",
        "@babel/helper-compilation-targets": "^7.28.6",
        "@babel/helper-module-transforms": "^7.28.6",
        "@babel/helpers": "^7.28.6",
        "@babel/parser": "^7.29.0",
        "@babel/template": "^7.28.6",
        "@babel/traverse": "^7.29.0",
        "@babel/types": "^7.29.0",
        "@jridgewell/remapping": "^2.3.5",
        "convert-source-map": "^2.0.0",
        "debug": "^4.1.0",
        "gensync": "^1.0.0-beta.2",
        "json5": "^2.2.3",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/babel"
      }
    },
    "node_modules/@babel/generator": {
      "version": "7.29.1",
      "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-7.29.1.tgz",
      "integrity": "sha512-qsaF+9Qcm2Qv8SRIMMscAvG4O3lJ0F1GuMo5HR/Bp02LopNgnZBC/EkbevHFeGs4ls/oPz9v+Bsmzbkbe+0dUw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.29.0",
        "@babel/types": "^7.29.0",
        "@jridgewell/gen-mapping": "^0.3.12",
        "@jridgewell/trace-mapping": "^0.3.28",
        "jsesc": "^3.0.2"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-compilation-targets": {
      "version": "7.28.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-compilation-targets/-/helper-compilation-targets-7.28.6.tgz",
      "integrity": "sha512-JYtls3hqi15fcx5GaSNL7SCTJ2MNmjrkHXg4FSpOA/grxK8KwyZ5bubHsCq8FXCkua6xhuaaBit+3b7+VZRfcA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/compat-data": "^7.28.6",
        "@babel/helper-validator-option": "^7.27.1",
        "browserslist": "^4.24.0",
        "lru-cache": "^5.1.1",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-globals": {
      "version": "7.28.0",
      "resolved": "https://registry.npmjs.org/@babel/helper-globals/-/helper-globals-7.28.0.tgz",
      "integrity": "sha512-+W6cISkXFa1jXsDEdYA8HeevQT/FULhxzR99pxphltZcVaugps53THCeiWA8SguxxpSp3gKPiuYfSWopkLQ4hw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-imports": {
      "version": "7.28.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-module-imports/-/helper-module-imports-7.28.6.tgz",
      "integrity": "sha512-l5XkZK7r7wa9LucGw9LwZyyCUscb4x37JWTPz7swwFE/0FMQAGpiWUZn8u9DzkSBWEcK25jmvubfpw2dnAMdbw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/traverse": "^7.28.6",
        "@babel/types": "^7.28.6"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-transforms": {
      "version": "7.28.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-module-transforms/-/helper-module-transforms-7.28.6.tgz",
      "integrity": "sha512-67oXFAYr2cDLDVGLXTEABjdBJZ6drElUSI7WKp70NrpyISso3plG9SAGEF6y7zbha/wOzUByWWTJvEDVNIUGcA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-module-imports": "^7.28.6",
        "@babel/helper-validator-identifier": "^7.28.5",
        "@babel/traverse": "^7.28.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/helper-plugin-utils": {
      "version": "7.28.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-plugin-utils/-/helper-plugin-utils-7.28.6.tgz",
      "integrity": "sha512-S9gzZ/bz83GRysI7gAD4wPT/AI3uCnY+9xn+Mx/KPs2JwHJIz1W8PZkg2cqyt3RNOBM8ejcXhV6y8Og7ly/Dug==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-string-parser": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-7.27.1.tgz",
      "integrity": "sha512-qMlSxKbpRlAridDExk92nSobyDdpPijUq2DW6oDnUqd0iOGxmQjyqhMIihI9+zv4LPyZdRje2cavWPbCbWm3eA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-validator-identifier": {
      "version": "7.28.5",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.28.5.tgz",
      "integrity": "sha512-qSs4ifwzKJSV39ucNjsvc6WVHs6b7S03sOh2OcHF9UHfVPqWWALUsNUVzhSBiItjRZoLHx7nIarVjqKVusUZ1Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-validator-option": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-option/-/helper-validator-option-7.27.1.tgz",
      "integrity": "sha512-YvjJow9FxbhFFKDSuFnVCe2WxXk1zWc22fFePVNEaWJEu8IrZVlda6N0uHwzZrUM1il7NC9Mlp4MaJYbYd9JSg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helpers": {
      "version": "7.28.6",
      "resolved": "https://registry.npmjs.org/@babel/helpers/-/helpers-7.28.6.tgz",
      "integrity": "sha512-xOBvwq86HHdB7WUDTfKfT/Vuxh7gElQ+Sfti2Cy6yIWNW05P8iUslOVcZ4/sKbE+/jQaukQAdz/gf3724kYdqw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/template": "^7.28.6",
        "@babel/types": "^7.28.6"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/parser": {
      "version": "7.29.0",
      "resolved": "https://registry.npmjs.org/@babel/parser/-/parser-7.29.0.tgz",
      "integrity": "sha512-IyDgFV5GeDUVX4YdF/3CPULtVGSXXMLh1xVIgdCgxApktqnQV0r7/8Nqthg+8YLGaAtdyIlo2qIdZrbCv4+7ww==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.29.0"
      },
      "bin": {
        "parser": "bin/babel-parser.js"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@babel/plugin-transform-react-jsx-self": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-react-jsx-self/-/plugin-transform-react-jsx-self-7.27.1.tgz",
      "integrity": "sha512-6UzkCs+ejGdZ5mFFC/OCUrv028ab2fp1znZmCZjAOBKiBK2jXD1O+BPSfX8X2qjJ75fZBMSnQn3Rq2mrBJK2mw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.27.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-react-jsx-source": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-react-jsx-source/-/plugin-transform-react-jsx-source-7.27.1.tgz",
      "integrity": "sha512-zbwoTsBruTeKB9hSq73ha66iFeJHuaFkUbwvqElnygoNbj/jHRsSeokowZFN3CZ64IvEqcmmkVe89OPXc7ldAw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.27.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/template": {
      "version": "7.28.6",
      "resolved": "https://registry.npmjs.org/@babel/template/-/template-7.28.6.tgz",
      "integrity": "sha512-YA6Ma2KsCdGb+WC6UpBVFJGXL58MDA6oyONbjyF/+5sBgxY/dwkhLogbMT2GXXyU84/IhRw/2D1Os1B/giz+BQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.28.6",
        "@babel/parser": "^7.28.6",
        "@babel/types": "^7.28.6"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/traverse": {
      "version": "7.29.0",
      "resolved": "https://registry.npmjs.org/@babel/traverse/-/traverse-7.29.0.tgz",
      "integrity": "sha512-4HPiQr0X7+waHfyXPZpWPfWL/J7dcN1mx9gL6WdQVMbPnF3+ZhSMs8tCxN7oHddJE9fhNE7+lxdnlyemKfJRuA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.29.0",
        "@babel/generator": "^7.29.0",
        "@babel/helper-globals": "^7.28.0",
        "@babel/parser": "^7.29.0",
        "@babel/template": "^7.28.6",
        "@babel/types": "^7.29.0",
        "debug": "^4.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/types": {
      "version": "7.29.0",
      "resolved": "https://registry.npmjs.org/@babel/types/-/types-7.29.0.tgz",
      "integrity": "sha512-LwdZHpScM4Qz8Xw2iKSzS+cfglZzJGvofQICy7W7v4caru4EaAmyUuO6BGrbyQ2mYV11W0U8j5mBhd14dd3B0A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-string-parser": "^7.27.1",
        "@babel/helper-validator-identifier": "^7.28.5"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@esbuild/aix-ppc64": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/aix-ppc64/-/aix-ppc64-0.27.3.tgz",
      "integrity": "sha512-9fJMTNFTWZMh5qwrBItuziu834eOCUcEqymSH7pY+zoMVEZg3gcPuBNxH1EvfVYe9h0x/Ptw8KBzv7qxb7l8dg==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "aix"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/android-arm": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/android-arm/-/android-arm-0.27.3.tgz",
      "integrity": "sha512-i5D1hPY7GIQmXlXhs2w8AWHhenb00+GxjxRncS2ZM7YNVGNfaMxgzSGuO8o8SJzRc/oZwU2bcScvVERk03QhzA==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/android-arm64": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/android-arm64/-/android-arm64-0.27.3.tgz",
      "integrity": "sha512-YdghPYUmj/FX2SYKJ0OZxf+iaKgMsKHVPF1MAq/P8WirnSpCStzKJFjOjzsW0QQ7oIAiccHdcqjbHmJxRb/dmg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/android-x64": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/android-x64/-/android-x64-0.27.3.tgz",
      "integrity": "sha512-IN/0BNTkHtk8lkOM8JWAYFg4ORxBkZQf9zXiEOfERX/CzxW3Vg1ewAhU7QSWQpVIzTW+b8Xy+lGzdYXV6UZObQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/darwin-arm64": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/darwin-arm64/-/darwin-arm64-0.27.3.tgz",
      "integrity": "sha512-Re491k7ByTVRy0t3EKWajdLIr0gz2kKKfzafkth4Q8A5n1xTHrkqZgLLjFEHVD+AXdUGgQMq+Godfq45mGpCKg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/darwin-x64": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/darwin-x64/-/darwin-x64-0.27.3.tgz",
      "integrity": "sha512-vHk/hA7/1AckjGzRqi6wbo+jaShzRowYip6rt6q7VYEDX4LEy1pZfDpdxCBnGtl+A5zq8iXDcyuxwtv3hNtHFg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/freebsd-arm64": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-arm64/-/freebsd-arm64-0.27.3.tgz",
      "integrity": "sha512-ipTYM2fjt3kQAYOvo6vcxJx3nBYAzPjgTCk7QEgZG8AUO3ydUhvelmhrbOheMnGOlaSFUoHXB6un+A7q4ygY9w==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/freebsd-x64": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-x64/-/freebsd-x64-0.27.3.tgz",
      "integrity": "sha512-dDk0X87T7mI6U3K9VjWtHOXqwAMJBNN2r7bejDsc+j03SEjtD9HrOl8gVFByeM0aJksoUuUVU9TBaZa2rgj0oA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-arm": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm/-/linux-arm-0.27.3.tgz",
      "integrity": "sha512-s6nPv2QkSupJwLYyfS+gwdirm0ukyTFNl3KTgZEAiJDd+iHZcbTPPcWCcRYH+WlNbwChgH2QkE9NSlNrMT8Gfw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-arm64": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm64/-/linux-arm64-0.27.3.tgz",
      "integrity": "sha512-sZOuFz/xWnZ4KH3YfFrKCf1WyPZHakVzTiqji3WDc0BCl2kBwiJLCXpzLzUBLgmp4veFZdvN5ChW4Eq/8Fc2Fg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-ia32": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-ia32/-/linux-ia32-0.27.3.tgz",
      "integrity": "sha512-yGlQYjdxtLdh0a3jHjuwOrxQjOZYD/C9PfdbgJJF3TIZWnm/tMd/RcNiLngiu4iwcBAOezdnSLAwQDPqTmtTYg==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-loong64": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-loong64/-/linux-loong64-0.27.3.tgz",
      "integrity": "sha512-WO60Sn8ly3gtzhyjATDgieJNet/KqsDlX5nRC5Y3oTFcS1l0KWba+SEa9Ja1GfDqSF1z6hif/SkpQJbL63cgOA==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-mips64el": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-mips64el/-/linux-mips64el-0.27.3.tgz",
      "integrity": "sha512-APsymYA6sGcZ4pD6k+UxbDjOFSvPWyZhjaiPyl/f79xKxwTnrn5QUnXR5prvetuaSMsb4jgeHewIDCIWljrSxw==",
      "cpu": [
        "mips64el"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-ppc64": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-ppc64/-/linux-ppc64-0.27.3.tgz",
      "integrity": "sha512-eizBnTeBefojtDb9nSh4vvVQ3V9Qf9Df01PfawPcRzJH4gFSgrObw+LveUyDoKU3kxi5+9RJTCWlj4FjYXVPEA==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-riscv64": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-riscv64/-/linux-riscv64-0.27.3.tgz",
      "integrity": "sha512-3Emwh0r5wmfm3ssTWRQSyVhbOHvqegUDRd0WhmXKX2mkHJe1SFCMJhagUleMq+Uci34wLSipf8Lagt4LlpRFWQ==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-s390x": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-s390x/-/linux-s390x-0.27.3.tgz",
      "integrity": "sha512-pBHUx9LzXWBc7MFIEEL0yD/ZVtNgLytvx60gES28GcWMqil8ElCYR4kvbV2BDqsHOvVDRrOxGySBM9Fcv744hw==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-x64": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-x64/-/linux-x64-0.27.3.tgz",
      "integrity": "sha512-Czi8yzXUWIQYAtL/2y6vogER8pvcsOsk5cpwL4Gk5nJqH5UZiVByIY8Eorm5R13gq+DQKYg0+JyQoytLQas4dA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/netbsd-arm64": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-arm64/-/netbsd-arm64-0.27.3.tgz",
      "integrity": "sha512-sDpk0RgmTCR/5HguIZa9n9u+HVKf40fbEUt+iTzSnCaGvY9kFP0YKBWZtJaraonFnqef5SlJ8/TiPAxzyS+UoA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "netbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/netbsd-x64": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-x64/-/netbsd-x64-0.27.3.tgz",
      "integrity": "sha512-P14lFKJl/DdaE00LItAukUdZO5iqNH7+PjoBm+fLQjtxfcfFE20Xf5CrLsmZdq5LFFZzb5JMZ9grUwvtVYzjiA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "netbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/openbsd-arm64": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-arm64/-/openbsd-arm64-0.27.3.tgz",
      "integrity": "sha512-AIcMP77AvirGbRl/UZFTq5hjXK+2wC7qFRGoHSDrZ5v5b8DK/GYpXW3CPRL53NkvDqb9D+alBiC/dV0Fb7eJcw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/openbsd-x64": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-x64/-/openbsd-x64-0.27.3.tgz",
      "integrity": "sha512-DnW2sRrBzA+YnE70LKqnM3P+z8vehfJWHXECbwBmH/CU51z6FiqTQTHFenPlHmo3a8UgpLyH3PT+87OViOh1AQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/openharmony-arm64": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/openharmony-arm64/-/openharmony-arm64-0.27.3.tgz",
      "integrity": "sha512-NinAEgr/etERPTsZJ7aEZQvvg/A6IsZG/LgZy+81wON2huV7SrK3e63dU0XhyZP4RKGyTm7aOgmQk0bGp0fy2g==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openharmony"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/sunos-x64": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/sunos-x64/-/sunos-x64-0.27.3.tgz",
      "integrity": "sha512-PanZ+nEz+eWoBJ8/f8HKxTTD172SKwdXebZ0ndd953gt1HRBbhMsaNqjTyYLGLPdoWHy4zLU7bDVJztF5f3BHA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "sunos"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/win32-arm64": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-arm64/-/win32-arm64-0.27.3.tgz",
      "integrity": "sha512-B2t59lWWYrbRDw/tjiWOuzSsFh1Y/E95ofKz7rIVYSQkUYBjfSgf6oeYPNWHToFRr2zx52JKApIcAS/D5TUBnA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/win32-ia32": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-ia32/-/win32-ia32-0.27.3.tgz",
      "integrity": "sha512-QLKSFeXNS8+tHW7tZpMtjlNb7HKau0QDpwm49u0vUp9y1WOF+PEzkU84y9GqYaAVW8aH8f3GcBck26jh54cX4Q==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/win32-x64": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-0.27.3.tgz",
      "integrity": "sha512-4uJGhsxuptu3OcpVAzli+/gWusVGwZZHTlS63hh++ehExkVT8SgiEf7/uC/PclrPPkLhZqGgCTjd0VWLo6xMqA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@jridgewell/gen-mapping": {
      "version": "0.3.13",
      "resolved": "https://registry.npmjs.org/@jridgewell/gen-mapping/-/gen-mapping-0.3.13.tgz",
      "integrity": "sha512-2kkt/7niJ6MgEPxF0bYdQ6etZaA+fQvDcLKckhy1yIQOzaoKjBBjSj63/aLVjYE3qhRt5dvM+uUyfCg6UKCBbA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/sourcemap-codec": "^1.5.0",
        "@jridgewell/trace-mapping": "^0.3.24"
      }
    },
    "node_modules/@jridgewell/remapping": {
      "version": "2.3.5",
      "resolved": "https://registry.npmjs.org/@jridgewell/remapping/-/remapping-2.3.5.tgz",
      "integrity": "sha512-LI9u/+laYG4Ds1TDKSJW2YPrIlcVYOwi2fUC6xB43lueCjgxV4lffOCZCtYFiH6TNOX+tQKXx97T4IKHbhyHEQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/gen-mapping": "^0.3.5",
        "@jridgewell/trace-mapping": "^0.3.24"
      }
    },
    "node_modules/@jridgewell/resolve-uri": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/@jridgewell/resolve-uri/-/resolve-uri-3.1.2.tgz",
      "integrity": "sha512-bRISgCIjP20/tbWSPWMEi54QVPRZExkuD9lJL+UIxUKtwVJA8wW1Trb1jMs1RFXo1CBTNZ/5hpC9QvmKWdopKw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@jridgewell/sourcemap-codec": {
      "version": "1.5.5",
      "resolved": "https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.5.5.tgz",
      "integrity": "sha512-cYQ9310grqxueWbl+WuIUIaiUaDcj7WOq5fVhEljNVgRfOUhY9fy2zTvfoqWsnebh8Sl70VScFbICvJnLKB0Og==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@jridgewell/trace-mapping": {
      "version": "0.3.31",
      "resolved": "https://registry.npmjs.org/@jridgewell/trace-mapping/-/trace-mapping-0.3.31.tgz",
      "integrity": "sha512-zzNR+SdQSDJzc8joaeP8QQoCQr8NuYx2dIIytl1QeBEZHJ9uW6hebsrYgbz8hJwUQao3TWCMtmfV8Nu1twOLAw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/resolve-uri": "^3.1.0",
        "@jridgewell/sourcemap-codec": "^1.4.14"
      }
    },
    "node_modules/@rolldown/pluginutils": {
      "version": "1.0.0-rc.3",
      "resolved": "https://registry.npmjs.org/@rolldown/pluginutils/-/pluginutils-1.0.0-rc.3.tgz",
      "integrity": "sha512-eybk3TjzzzV97Dlj5c+XrBFW57eTNhzod66y9HrBlzJ6NsCrWCp/2kaPS3K9wJmurBC0Tdw4yPjXKZqlznim3Q==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@rollup/rollup-android-arm-eabi": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-android-arm-eabi/-/rollup-android-arm-eabi-4.59.0.tgz",
      "integrity": "sha512-upnNBkA6ZH2VKGcBj9Fyl9IGNPULcjXRlg0LLeaioQWueH30p6IXtJEbKAgvyv+mJaMxSm1l6xwDXYjpEMiLMg==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ]
    },
    "node_modules/@rollup/rollup-android-arm64": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-android-arm64/-/rollup-android-arm64-4.59.0.tgz",
      "integrity": "sha512-hZ+Zxj3SySm4A/DylsDKZAeVg0mvi++0PYVceVyX7hemkw7OreKdCvW2oQ3T1FMZvCaQXqOTHb8qmBShoqk69Q==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ]
    },
    "node_modules/@rollup/rollup-darwin-arm64": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-darwin-arm64/-/rollup-darwin-arm64-4.59.0.tgz",
      "integrity": "sha512-W2Psnbh1J8ZJw0xKAd8zdNgF9HRLkdWwwdWqubSVk0pUuQkoHnv7rx4GiF9rT4t5DIZGAsConRE3AxCdJ4m8rg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@rollup/rollup-darwin-x64": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-darwin-x64/-/rollup-darwin-x64-4.59.0.tgz",
      "integrity": "sha512-ZW2KkwlS4lwTv7ZVsYDiARfFCnSGhzYPdiOU4IM2fDbL+QGlyAbjgSFuqNRbSthybLbIJ915UtZBtmuLrQAT/w==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@rollup/rollup-freebsd-arm64": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-freebsd-arm64/-/rollup-freebsd-arm64-4.59.0.tgz",
      "integrity": "sha512-EsKaJ5ytAu9jI3lonzn3BgG8iRBjV4LxZexygcQbpiU0wU0ATxhNVEpXKfUa0pS05gTcSDMKpn3Sx+QB9RlTTA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ]
    },
    "node_modules/@rollup/rollup-freebsd-x64": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-freebsd-x64/-/rollup-freebsd-x64-4.59.0.tgz",
      "integrity": "sha512-d3DuZi2KzTMjImrxoHIAODUZYoUUMsuUiY4SRRcJy6NJoZ6iIqWnJu9IScV9jXysyGMVuW+KNzZvBLOcpdl3Vg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm-gnueabihf": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm-gnueabihf/-/rollup-linux-arm-gnueabihf-4.59.0.tgz",
      "integrity": "sha512-t4ONHboXi/3E0rT6OZl1pKbl2Vgxf9vJfWgmUoCEVQVxhW6Cw/c8I6hbbu7DAvgp82RKiH7TpLwxnJeKv2pbsw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm-musleabihf": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm-musleabihf/-/rollup-linux-arm-musleabihf-4.59.0.tgz",
      "integrity": "sha512-CikFT7aYPA2ufMD086cVORBYGHffBo4K8MQ4uPS/ZnY54GKj36i196u8U+aDVT2LX4eSMbyHtyOh7D7Zvk2VvA==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm64-gnu": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm64-gnu/-/rollup-linux-arm64-gnu-4.59.0.tgz",
      "integrity": "sha512-jYgUGk5aLd1nUb1CtQ8E+t5JhLc9x5WdBKew9ZgAXg7DBk0ZHErLHdXM24rfX+bKrFe+Xp5YuJo54I5HFjGDAA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm64-musl": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm64-musl/-/rollup-linux-arm64-musl-4.59.0.tgz",
      "integrity": "sha512-peZRVEdnFWZ5Bh2KeumKG9ty7aCXzzEsHShOZEFiCQlDEepP1dpUl/SrUNXNg13UmZl+gzVDPsiCwnV1uI0RUA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-loong64-gnu": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-loong64-gnu/-/rollup-linux-loong64-gnu-4.59.0.tgz",
      "integrity": "sha512-gbUSW/97f7+r4gHy3Jlup8zDG190AuodsWnNiXErp9mT90iCy9NKKU0Xwx5k8VlRAIV2uU9CsMnEFg/xXaOfXg==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-loong64-musl": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-loong64-musl/-/rollup-linux-loong64-musl-4.59.0.tgz",
      "integrity": "sha512-yTRONe79E+o0FWFijasoTjtzG9EBedFXJMl888NBEDCDV9I2wGbFFfJQQe63OijbFCUZqxpHz1GzpbtSFikJ4Q==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-ppc64-gnu": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-ppc64-gnu/-/rollup-linux-ppc64-gnu-4.59.0.tgz",
      "integrity": "sha512-sw1o3tfyk12k3OEpRddF68a1unZ5VCN7zoTNtSn2KndUE+ea3m3ROOKRCZxEpmT9nsGnogpFP9x6mnLTCaoLkA==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-ppc64-musl": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-ppc64-musl/-/rollup-linux-ppc64-musl-4.59.0.tgz",
      "integrity": "sha512-+2kLtQ4xT3AiIxkzFVFXfsmlZiG5FXYW7ZyIIvGA7Bdeuh9Z0aN4hVyXS/G1E9bTP/vqszNIN/pUKCk/BTHsKA==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-riscv64-gnu": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-riscv64-gnu/-/rollup-linux-riscv64-gnu-4.59.0.tgz",
      "integrity": "sha512-NDYMpsXYJJaj+I7UdwIuHHNxXZ/b/N2hR15NyH3m2qAtb/hHPA4g4SuuvrdxetTdndfj9b1WOmy73kcPRoERUg==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-riscv64-musl": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-riscv64-musl/-/rollup-linux-riscv64-musl-4.59.0.tgz",
      "integrity": "sha512-nLckB8WOqHIf1bhymk+oHxvM9D3tyPndZH8i8+35p/1YiVoVswPid2yLzgX7ZJP0KQvnkhM4H6QZ5m0LzbyIAg==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-s390x-gnu": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-s390x-gnu/-/rollup-linux-s390x-gnu-4.59.0.tgz",
      "integrity": "sha512-oF87Ie3uAIvORFBpwnCvUzdeYUqi2wY6jRFWJAy1qus/udHFYIkplYRW+wo+GRUP4sKzYdmE1Y3+rY5Gc4ZO+w==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-x64-gnu": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-x64-gnu/-/rollup-linux-x64-gnu-4.59.0.tgz",
      "integrity": "sha512-3AHmtQq/ppNuUspKAlvA8HtLybkDflkMuLK4DPo77DfthRb71V84/c4MlWJXixZz4uruIH4uaa07IqoAkG64fg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-x64-musl": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-x64-musl/-/rollup-linux-x64-musl-4.59.0.tgz",
      "integrity": "sha512-2UdiwS/9cTAx7qIUZB/fWtToJwvt0Vbo0zmnYt7ED35KPg13Q0ym1g442THLC7VyI6JfYTP4PiSOWyoMdV2/xg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-openbsd-x64": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-openbsd-x64/-/rollup-openbsd-x64-4.59.0.tgz",
      "integrity": "sha512-M3bLRAVk6GOwFlPTIxVBSYKUaqfLrn8l0psKinkCFxl4lQvOSz8ZrKDz2gxcBwHFpci0B6rttydI4IpS4IS/jQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ]
    },
    "node_modules/@rollup/rollup-openharmony-arm64": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-openharmony-arm64/-/rollup-openharmony-arm64-4.59.0.tgz",
      "integrity": "sha512-tt9KBJqaqp5i5HUZzoafHZX8b5Q2Fe7UjYERADll83O4fGqJ49O1FsL6LpdzVFQcpwvnyd0i+K/VSwu/o/nWlA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openharmony"
      ]
    },
    "node_modules/@rollup/rollup-win32-arm64-msvc": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-arm64-msvc/-/rollup-win32-arm64-msvc-4.59.0.tgz",
      "integrity": "sha512-V5B6mG7OrGTwnxaNUzZTDTjDS7F75PO1ae6MJYdiMu60sq0CqN5CVeVsbhPxalupvTX8gXVSU9gq+Rx1/hvu6A==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@rollup/rollup-win32-ia32-msvc": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-ia32-msvc/-/rollup-win32-ia32-msvc-4.59.0.tgz",
      "integrity": "sha512-UKFMHPuM9R0iBegwzKF4y0C4J9u8C6MEJgFuXTBerMk7EJ92GFVFYBfOZaSGLu6COf7FxpQNqhNS4c4icUPqxA==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@rollup/rollup-win32-x64-gnu": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-x64-gnu/-/rollup-win32-x64-gnu-4.59.0.tgz",
      "integrity": "sha512-laBkYlSS1n2L8fSo1thDNGrCTQMmxjYY5G0WFWjFFYZkKPjsMBsgJfGf4TLxXrF6RyhI60L8TMOjBMvXiTcxeA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@rollup/rollup-win32-x64-msvc": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-x64-msvc/-/rollup-win32-x64-msvc-4.59.0.tgz",
      "integrity": "sha512-2HRCml6OztYXyJXAvdDXPKcawukWY2GpR5/nxKp4iBgiO3wcoEGkAaqctIbZcNB6KlUQBIqt8VYkNSj2397EfA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@tailwindcss/node": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/@tailwindcss/node/-/node-4.2.1.tgz",
      "integrity": "sha512-jlx6sLk4EOwO6hHe1oCGm1Q4AN/s0rSrTTPBGPM0/RQ6Uylwq17FuU8IeJJKEjtc6K6O07zsvP+gDO6MMWo7pg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/remapping": "^2.3.5",
        "enhanced-resolve": "^5.19.0",
        "jiti": "^2.6.1",
        "lightningcss": "1.31.1",
        "magic-string": "^0.30.21",
        "source-map-js": "^1.2.1",
        "tailwindcss": "4.2.1"
      }
    },
    "node_modules/@tailwindcss/oxide": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide/-/oxide-4.2.1.tgz",
      "integrity": "sha512-yv9jeEFWnjKCI6/T3Oq50yQEOqmpmpfzG1hcZsAOaXFQPfzWprWrlHSdGPEF3WQTi8zu8ohC9Mh9J470nT5pUw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 20"
      },
      "optionalDependencies": {
        "@tailwindcss/oxide-android-arm64": "4.2.1",
        "@tailwindcss/oxide-darwin-arm64": "4.2.1",
        "@tailwindcss/oxide-darwin-x64": "4.2.1",
        "@tailwindcss/oxide-freebsd-x64": "4.2.1",
        "@tailwindcss/oxide-linux-arm-gnueabihf": "4.2.1",
        "@tailwindcss/oxide-linux-arm64-gnu": "4.2.1",
        "@tailwindcss/oxide-linux-arm64-musl": "4.2.1",
        "@tailwindcss/oxide-linux-x64-gnu": "4.2.1",
        "@tailwindcss/oxide-linux-x64-musl": "4.2.1",
        "@tailwindcss/oxide-wasm32-wasi": "4.2.1",
        "@tailwindcss/oxide-win32-arm64-msvc": "4.2.1",
        "@tailwindcss/oxide-win32-x64-msvc": "4.2.1"
      }
    },
    "node_modules/@tailwindcss/oxide-android-arm64": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-android-arm64/-/oxide-android-arm64-4.2.1.tgz",
      "integrity": "sha512-eZ7G1Zm5EC8OOKaesIKuw77jw++QJ2lL9N+dDpdQiAB/c/B2wDh0QPFHbkBVrXnwNugvrbJFk1gK2SsVjwWReg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-darwin-arm64": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-darwin-arm64/-/oxide-darwin-arm64-4.2.1.tgz",
      "integrity": "sha512-q/LHkOstoJ7pI1J0q6djesLzRvQSIfEto148ppAd+BVQK0JYjQIFSK3JgYZJa+Yzi0DDa52ZsQx2rqytBnf8Hw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-darwin-x64": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-darwin-x64/-/oxide-darwin-x64-4.2.1.tgz",
      "integrity": "sha512-/f/ozlaXGY6QLbpvd/kFTro2l18f7dHKpB+ieXz+Cijl4Mt9AI2rTrpq7V+t04nK+j9XBQHnSMdeQRhbGyt6fw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-freebsd-x64": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-freebsd-x64/-/oxide-freebsd-x64-4.2.1.tgz",
      "integrity": "sha512-5e/AkgYJT/cpbkys/OU2Ei2jdETCLlifwm7ogMC7/hksI2fC3iiq6OcXwjibcIjPung0kRtR3TxEITkqgn0TcA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-arm-gnueabihf": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-arm-gnueabihf/-/oxide-linux-arm-gnueabihf-4.2.1.tgz",
      "integrity": "sha512-Uny1EcVTTmerCKt/1ZuKTkb0x8ZaiuYucg2/kImO5A5Y/kBz41/+j0gxUZl+hTF3xkWpDmHX+TaWhOtba2Fyuw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-arm64-gnu": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-arm64-gnu/-/oxide-linux-arm64-gnu-4.2.1.tgz",
      "integrity": "sha512-CTrwomI+c7n6aSSQlsPL0roRiNMDQ/YzMD9EjcR+H4f0I1SQ8QqIuPnsVp7QgMkC1Qi8rtkekLkOFjo7OlEFRQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-arm64-musl": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-arm64-musl/-/oxide-linux-arm64-musl-4.2.1.tgz",
      "integrity": "sha512-WZA0CHRL/SP1TRbA5mp9htsppSEkWuQ4KsSUumYQnyl8ZdT39ntwqmz4IUHGN6p4XdSlYfJwM4rRzZLShHsGAQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-x64-gnu": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-x64-gnu/-/oxide-linux-x64-gnu-4.2.1.tgz",
      "integrity": "sha512-qMFzxI2YlBOLW5PhblzuSWlWfwLHaneBE0xHzLrBgNtqN6mWfs+qYbhryGSXQjFYB1Dzf5w+LN5qbUTPhW7Y5g==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-x64-musl": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-x64-musl/-/oxide-linux-x64-musl-4.2.1.tgz",
      "integrity": "sha512-5r1X2FKnCMUPlXTWRYpHdPYUY6a1Ar/t7P24OuiEdEOmms5lyqjDRvVY1yy9Rmioh+AunQ0rWiOTPE8F9A3v5g==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-wasm32-wasi": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-wasm32-wasi/-/oxide-wasm32-wasi-4.2.1.tgz",
      "integrity": "sha512-MGFB5cVPvshR85MTJkEvqDUnuNoysrsRxd6vnk1Lf2tbiqNlXpHYZqkqOQalydienEWOHHFyyuTSYRsLfxFJ2Q==",
      "bundleDependencies": [
        "@napi-rs/wasm-runtime",
        "@emnapi/core",
        "@emnapi/runtime",
        "@tybys/wasm-util",
        "@emnapi/wasi-threads",
        "tslib"
      ],
      "cpu": [
        "wasm32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@emnapi/core": "^1.8.1",
        "@emnapi/runtime": "^1.8.1",
        "@emnapi/wasi-threads": "^1.1.0",
        "@napi-rs/wasm-runtime": "^1.1.1",
        "@tybys/wasm-util": "^0.10.1",
        "tslib": "^2.8.1"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@tailwindcss/oxide-win32-arm64-msvc": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-win32-arm64-msvc/-/oxide-win32-arm64-msvc-4.2.1.tgz",
      "integrity": "sha512-YlUEHRHBGnCMh4Nj4GnqQyBtsshUPdiNroZj8VPkvTZSoHsilRCwXcVKnG9kyi0ZFAS/3u+qKHBdDc81SADTRA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-win32-x64-msvc": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-win32-x64-msvc/-/oxide-win32-x64-msvc-4.2.1.tgz",
      "integrity": "sha512-rbO34G5sMWWyrN/idLeVxAZgAKWrn5LiR3/I90Q9MkA67s6T1oB0xtTe+0heoBvHSpbU9Mk7i6uwJnpo4u21XQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/vite": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/@tailwindcss/vite/-/vite-4.2.1.tgz",
      "integrity": "sha512-TBf2sJjYeb28jD2U/OhwdW0bbOsxkWPwQ7SrqGf9sVcoYwZj7rkXljroBO9wKBut9XnmQLXanuDUeqQK0lGg/w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@tailwindcss/node": "4.2.1",
        "@tailwindcss/oxide": "4.2.1",
        "tailwindcss": "4.2.1"
      },
      "peerDependencies": {
        "vite": "^5.2.0 || ^6 || ^7"
      }
    },
    "node_modules/@types/babel__core": {
      "version": "7.20.5",
      "resolved": "https://registry.npmjs.org/@types/babel__core/-/babel__core-7.20.5.tgz",
      "integrity": "sha512-qoQprZvz5wQFJwMDqeseRXWv3rqMvhgpbXFfVyWhbx9X47POIA6i/+dXefEmZKoAgOaTdaIgNSMqMIU61yRyzA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.20.7",
        "@babel/types": "^7.20.7",
        "@types/babel__generator": "*",
        "@types/babel__template": "*",
        "@types/babel__traverse": "*"
      }
    },
    "node_modules/@types/babel__generator": {
      "version": "7.27.0",
      "resolved": "https://registry.npmjs.org/@types/babel__generator/-/babel__generator-7.27.0.tgz",
      "integrity": "sha512-ufFd2Xi92OAVPYsy+P4n7/U7e68fex0+Ee8gSG9KX7eo084CWiQ4sdxktvdl0bOPupXtVJPY19zk6EwWqUQ8lg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.0.0"
      }
    },
    "node_modules/@types/babel__template": {
      "version": "7.4.4",
      "resolved": "https://registry.npmjs.org/@types/babel__template/-/babel__template-7.4.4.tgz",
      "integrity": "sha512-h/NUaSyG5EyxBIp8YRxo4RMe2/qQgvyowRwVMzhYhBCONbW8PUsg4lkFMrhgZhUe5z3L3MiLDuvyJ/CaPa2A8A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.1.0",
        "@babel/types": "^7.0.0"
      }
    },
    "node_modules/@types/babel__traverse": {
      "version": "7.28.0",
      "resolved": "https://registry.npmjs.org/@types/babel__traverse/-/babel__traverse-7.28.0.tgz",
      "integrity": "sha512-8PvcXf70gTDZBgt9ptxJ8elBeBjcLOAcOtoO/mPJjtji1+CdGbHgm77om1GrsPxsiE+uXIpNSK64UYaIwQXd4Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.28.2"
      }
    },
    "node_modules/@types/estree": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/@types/estree/-/estree-1.0.8.tgz",
      "integrity": "sha512-dWHzHa2WqEXI/O1E9OjrocMTKJl2mSrEolh1Iomrv6U+JuNwaHXsXx9bLu5gG7BUWFIN0skIQJQ/L1rIex4X6w==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/react": {
      "version": "19.2.14",
      "resolved": "https://registry.npmjs.org/@types/react/-/react-19.2.14.tgz",
      "integrity": "sha512-ilcTH/UniCkMdtexkoCN0bI7pMcJDvmQFPvuPvmEaYA/NSfFTAgdUSLAoVjaRJm7+6PvcM+q1zYOwS4wTYMF9w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "csstype": "^3.2.2"
      }
    },
    "node_modules/@types/react-dom": {
      "version": "19.2.3",
      "resolved": "https://registry.npmjs.org/@types/react-dom/-/react-dom-19.2.3.tgz",
      "integrity": "sha512-jp2L/eY6fn+KgVVQAOqYItbF0VY/YApe5Mz2F0aykSO8gx31bYCZyvSeYxCHKvzHG5eZjc+zyaS5BrBWya2+kQ==",
      "dev": true,
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "^19.2.0"
      }
    },
    "node_modules/@vitejs/plugin-react": {
      "version": "5.1.4",
      "resolved": "https://registry.npmjs.org/@vitejs/plugin-react/-/plugin-react-5.1.4.tgz",
      "integrity": "sha512-VIcFLdRi/VYRU8OL/puL7QXMYafHmqOnwTZY50U1JPlCNj30PxCMx65c494b1K9be9hX83KVt0+gTEwTWLqToA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/core": "^7.29.0",
        "@babel/plugin-transform-react-jsx-self": "^7.27.1",
        "@babel/plugin-transform-react-jsx-source": "^7.27.1",
        "@rolldown/pluginutils": "1.0.0-rc.3",
        "@types/babel__core": "^7.20.5",
        "react-refresh": "^0.18.0"
      },
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      },
      "peerDependencies": {
        "vite": "^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0"
      }
    },
    "node_modules/baseline-browser-mapping": {
      "version": "2.10.0",
      "resolved": "https://registry.npmjs.org/baseline-browser-mapping/-/baseline-browser-mapping-2.10.0.tgz",
      "integrity": "sha512-lIyg0szRfYbiy67j9KN8IyeD7q7hcmqnJ1ddWmNt19ItGpNN64mnllmxUNFIOdOm6by97jlL6wfpTTJrmnjWAA==",
      "dev": true,
      "license": "Apache-2.0",
      "bin": {
        "baseline-browser-mapping": "dist/cli.cjs"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/browserslist": {
      "version": "4.28.1",
      "resolved": "https://registry.npmjs.org/browserslist/-/browserslist-4.28.1.tgz",
      "integrity": "sha512-ZC5Bd0LgJXgwGqUknZY/vkUQ04r8NXnJZ3yYi4vDmSiZmC/pdSN0NbNRPxZpbtO4uAfDUAFffO8IZoM3Gj8IkA==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/browserslist"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "baseline-browser-mapping": "^2.9.0",
        "caniuse-lite": "^1.0.30001759",
        "electron-to-chromium": "^1.5.263",
        "node-releases": "^2.0.27",
        "update-browserslist-db": "^1.2.0"
      },
      "bin": {
        "browserslist": "cli.js"
      },
      "engines": {
        "node": "^6 || ^7 || ^8 || ^9 || ^10 || ^11 || ^12 || >=13.7"
      }
    },
    "node_modules/caniuse-lite": {
      "version": "1.0.30001775",
      "resolved": "https://registry.npmjs.org/caniuse-lite/-/caniuse-lite-1.0.30001775.tgz",
      "integrity": "sha512-s3Qv7Lht9zbVKE9XoTyRG6wVDCKdtOFIjBGg3+Yhn6JaytuNKPIjBMTMIY1AnOH3seL5mvF+x33oGAyK3hVt3A==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/caniuse-lite"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "CC-BY-4.0"
    },
    "node_modules/convert-source-map": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/convert-source-map/-/convert-source-map-2.0.0.tgz",
      "integrity": "sha512-Kvp459HrV2FEJ1CAsi1Ku+MY3kasH19TFykTz2xWmMeq6bk2NU3XXvfJ+Q61m0xktWwt+1HSYf3JZsTms3aRJg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/csstype": {
      "version": "3.2.3",
      "resolved": "https://registry.npmjs.org/csstype/-/csstype-3.2.3.tgz",
      "integrity": "sha512-z1HGKcYy2xA8AGQfwrn0PAy+PB7X/GSj3UVJW9qKyn43xWa+gl5nXmU4qqLMRzWVLFC8KusUX8T/0kCiOYpAIQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/debug": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
      "integrity": "sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.3"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/detect-libc": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/detect-libc/-/detect-libc-2.1.2.tgz",
      "integrity": "sha512-Btj2BOOO83o3WyH59e8MgXsxEQVcarkUOpEYrubB0urwnN10yQ364rsiByU11nZlqWYZm05i/of7io4mzihBtQ==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/electron-to-chromium": {
      "version": "1.5.302",
      "resolved": "https://registry.npmjs.org/electron-to-chromium/-/electron-to-chromium-1.5.302.tgz",
      "integrity": "sha512-sM6HAN2LyK82IyPBpznDRqlTQAtuSaO+ShzFiWTvoMJLHyZ+Y39r8VMfHzwbU8MVBzQ4Wdn85+wlZl2TLGIlwg==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/enhanced-resolve": {
      "version": "5.20.0",
      "resolved": "https://registry.npmjs.org/enhanced-resolve/-/enhanced-resolve-5.20.0.tgz",
      "integrity": "sha512-/ce7+jQ1PQ6rVXwe+jKEg5hW5ciicHwIQUagZkp6IufBoY3YDgdTTY1azVs0qoRgVmvsNB+rbjLJxDAeHHtwsQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "graceful-fs": "^4.2.4",
        "tapable": "^2.3.0"
      },
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/esbuild": {
      "version": "0.27.3",
      "resolved": "https://registry.npmjs.org/esbuild/-/esbuild-0.27.3.tgz",
      "integrity": "sha512-8VwMnyGCONIs6cWue2IdpHxHnAjzxnw2Zr7MkVxB2vjmQ2ivqGFb4LEG3SMnv0Gb2F/G/2yA8zUaiL1gywDCCg==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "bin": {
        "esbuild": "bin/esbuild"
      },
      "engines": {
        "node": ">=18"
      },
      "optionalDependencies": {
        "@esbuild/aix-ppc64": "0.27.3",
        "@esbuild/android-arm": "0.27.3",
        "@esbuild/android-arm64": "0.27.3",
        "@esbuild/android-x64": "0.27.3",
        "@esbuild/darwin-arm64": "0.27.3",
        "@esbuild/darwin-x64": "0.27.3",
        "@esbuild/freebsd-arm64": "0.27.3",
        "@esbuild/freebsd-x64": "0.27.3",
        "@esbuild/linux-arm": "0.27.3",
        "@esbuild/linux-arm64": "0.27.3",
        "@esbuild/linux-ia32": "0.27.3",
        "@esbuild/linux-loong64": "0.27.3",
        "@esbuild/linux-mips64el": "0.27.3",
        "@esbuild/linux-ppc64": "0.27.3",
        "@esbuild/linux-riscv64": "0.27.3",
        "@esbuild/linux-s390x": "0.27.3",
        "@esbuild/linux-x64": "0.27.3",
        "@esbuild/netbsd-arm64": "0.27.3",
        "@esbuild/netbsd-x64": "0.27.3",
        "@esbuild/openbsd-arm64": "0.27.3",
        "@esbuild/openbsd-x64": "0.27.3",
        "@esbuild/openharmony-arm64": "0.27.3",
        "@esbuild/sunos-x64": "0.27.3",
        "@esbuild/win32-arm64": "0.27.3",
        "@esbuild/win32-ia32": "0.27.3",
        "@esbuild/win32-x64": "0.27.3"
      }
    },
    "node_modules/escalade": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/escalade/-/escalade-3.2.0.tgz",
      "integrity": "sha512-WUj2qlxaQtO4g6Pq5c29GTcWGDyd8itL8zTlipgECz3JesAiiOKotd8JU6otB3PACgG6xkJUyVhboMS+bje/jA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/fdir": {
      "version": "6.5.0",
      "resolved": "https://registry.npmjs.org/fdir/-/fdir-6.5.0.tgz",
      "integrity": "sha512-tIbYtZbucOs0BRGqPJkshJUYdL+SDH7dVM8gjy+ERp3WAUjLEFJE+02kanyHtwjWOnwrKYBiwAmM0p4kLJAnXg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12.0.0"
      },
      "peerDependencies": {
        "picomatch": "^3 || ^4"
      },
      "peerDependenciesMeta": {
        "picomatch": {
          "optional": true
        }
      }
    },
    "node_modules/fsevents": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/fsevents/-/fsevents-2.3.3.tgz",
      "integrity": "sha512-5xoDfX+fL7faATnagmWPpbFtwh/R77WmMMqqHGS65C3vvB0YHrgF+B1YmZ3441tMj5n63k0212XNoJwzlhffQw==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^8.16.0 || ^10.6.0 || >=11.0.0"
      }
    },
    "node_modules/gensync": {
      "version": "1.0.0-beta.2",
      "resolved": "https://registry.npmjs.org/gensync/-/gensync-1.0.0-beta.2.tgz",
      "integrity": "sha512-3hN7NaskYvMDLQY55gnW3NQ+mesEAepTqlg+VEbj7zzqEMBVNhzcGYYeqFo/TlYz6eQiFcp1HcsCZO+nGgS8zg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/graceful-fs": {
      "version": "4.2.11",
      "resolved": "https://registry.npmjs.org/graceful-fs/-/graceful-fs-4.2.11.tgz",
      "integrity": "sha512-RbJ5/jmFcNNCcDV5o9eTnBLJ/HszWV0P73bc+Ff4nS/rJj+YaS6IGyiOL0VoBYX+l1Wrl3k63h/KrH+nhJ0XvQ==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/jiti": {
      "version": "2.6.1",
      "resolved": "https://registry.npmjs.org/jiti/-/jiti-2.6.1.tgz",
      "integrity": "sha512-ekilCSN1jwRvIbgeg/57YFh8qQDNbwDb9xT/qu2DAHbFFZUicIl4ygVaAvzveMhMVr3LnpSKTNnwt8PoOfmKhQ==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "jiti": "lib/jiti-cli.mjs"
      }
    },
    "node_modules/js-tokens": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-4.0.0.tgz",
      "integrity": "sha512-RdJUflcE3cUzKiMqQgsCu06FPu9UdIJO0beYbPhHN4k6apgJtifcoCtT9bcxOpYBtpD2kCM6Sbzg4CausW/PKQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/jsesc": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/jsesc/-/jsesc-3.1.0.tgz",
      "integrity": "sha512-/sM3dO2FOzXjKQhJuo0Q173wf2KOo8t4I8vHy6lF9poUp7bKT0/NHE8fPX23PwfhnykfqnC2xRxOnVw5XuGIaA==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "jsesc": "bin/jsesc"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/json5": {
      "version": "2.2.3",
      "resolved": "https://registry.npmjs.org/json5/-/json5-2.2.3.tgz",
      "integrity": "sha512-XmOWe7eyHYH14cLdVPoyg+GOH3rYX++KpzrylJwSW98t3Nk+U8XOl8FWKOgwtzdb8lXGf6zYwDUzeHMWfxasyg==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "json5": "lib/cli.js"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/lightningcss": {
      "version": "1.31.1",
      "resolved": "https://registry.npmjs.org/lightningcss/-/lightningcss-1.31.1.tgz",
      "integrity": "sha512-l51N2r93WmGUye3WuFoN5k10zyvrVs0qfKBhyC5ogUQ6Ew6JUSswh78mbSO+IU3nTWsyOArqPCcShdQSadghBQ==",
      "dev": true,
      "license": "MPL-2.0",
      "dependencies": {
        "detect-libc": "^2.0.3"
      },
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      },
      "optionalDependencies": {
        "lightningcss-android-arm64": "1.31.1",
        "lightningcss-darwin-arm64": "1.31.1",
        "lightningcss-darwin-x64": "1.31.1",
        "lightningcss-freebsd-x64": "1.31.1",
        "lightningcss-linux-arm-gnueabihf": "1.31.1",
        "lightningcss-linux-arm64-gnu": "1.31.1",
        "lightningcss-linux-arm64-musl": "1.31.1",
        "lightningcss-linux-x64-gnu": "1.31.1",
        "lightningcss-linux-x64-musl": "1.31.1",
        "lightningcss-win32-arm64-msvc": "1.31.1",
        "lightningcss-win32-x64-msvc": "1.31.1"
      }
    },
    "node_modules/lightningcss-android-arm64": {
      "version": "1.31.1",
      "resolved": "https://registry.npmjs.org/lightningcss-android-arm64/-/lightningcss-android-arm64-1.31.1.tgz",
      "integrity": "sha512-HXJF3x8w9nQ4jbXRiNppBCqeZPIAfUo8zE/kOEGbW5NZvGc/K7nMxbhIr+YlFlHW5mpbg/YFPdbnCh1wAXCKFg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-darwin-arm64": {
      "version": "1.31.1",
      "resolved": "https://registry.npmjs.org/lightningcss-darwin-arm64/-/lightningcss-darwin-arm64-1.31.1.tgz",
      "integrity": "sha512-02uTEqf3vIfNMq3h/z2cJfcOXnQ0GRwQrkmPafhueLb2h7mqEidiCzkE4gBMEH65abHRiQvhdcQ+aP0D0g67sg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-darwin-x64": {
      "version": "1.31.1",
      "resolved": "https://registry.npmjs.org/lightningcss-darwin-x64/-/lightningcss-darwin-x64-1.31.1.tgz",
      "integrity": "sha512-1ObhyoCY+tGxtsz1lSx5NXCj3nirk0Y0kB/g8B8DT+sSx4G9djitg9ejFnjb3gJNWo7qXH4DIy2SUHvpoFwfTA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-freebsd-x64": {
      "version": "1.31.1",
      "resolved": "https://registry.npmjs.org/lightningcss-freebsd-x64/-/lightningcss-freebsd-x64-1.31.1.tgz",
      "integrity": "sha512-1RINmQKAItO6ISxYgPwszQE1BrsVU5aB45ho6O42mu96UiZBxEXsuQ7cJW4zs4CEodPUioj/QrXW1r9pLUM74A==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-arm-gnueabihf": {
      "version": "1.31.1",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm-gnueabihf/-/lightningcss-linux-arm-gnueabihf-1.31.1.tgz",
      "integrity": "sha512-OOCm2//MZJ87CdDK62rZIu+aw9gBv4azMJuA8/KB74wmfS3lnC4yoPHm0uXZ/dvNNHmnZnB8XLAZzObeG0nS1g==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-arm64-gnu": {
      "version": "1.31.1",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm64-gnu/-/lightningcss-linux-arm64-gnu-1.31.1.tgz",
      "integrity": "sha512-WKyLWztD71rTnou4xAD5kQT+982wvca7E6QoLpoawZ1gP9JM0GJj4Tp5jMUh9B3AitHbRZ2/H3W5xQmdEOUlLg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-arm64-musl": {
      "version": "1.31.1",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm64-musl/-/lightningcss-linux-arm64-musl-1.31.1.tgz",
      "integrity": "sha512-mVZ7Pg2zIbe3XlNbZJdjs86YViQFoJSpc41CbVmKBPiGmC4YrfeOyz65ms2qpAobVd7WQsbW4PdsSJEMymyIMg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-x64-gnu": {
      "version": "1.31.1",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-x64-gnu/-/lightningcss-linux-x64-gnu-1.31.1.tgz",
      "integrity": "sha512-xGlFWRMl+0KvUhgySdIaReQdB4FNudfUTARn7q0hh/V67PVGCs3ADFjw+6++kG1RNd0zdGRlEKa+T13/tQjPMA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-x64-musl": {
      "version": "1.31.1",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-x64-musl/-/lightningcss-linux-x64-musl-1.31.1.tgz",
      "integrity": "sha512-eowF8PrKHw9LpoZii5tdZwnBcYDxRw2rRCyvAXLi34iyeYfqCQNA9rmUM0ce62NlPhCvof1+9ivRaTY6pSKDaA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-win32-arm64-msvc": {
      "version": "1.31.1",
      "resolved": "https://registry.npmjs.org/lightningcss-win32-arm64-msvc/-/lightningcss-win32-arm64-msvc-1.31.1.tgz",
      "integrity": "sha512-aJReEbSEQzx1uBlQizAOBSjcmr9dCdL3XuC/6HLXAxmtErsj2ICo5yYggg1qOODQMtnjNQv2UHb9NpOuFtYe4w==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-win32-x64-msvc": {
      "version": "1.31.1",
      "resolved": "https://registry.npmjs.org/lightningcss-win32-x64-msvc/-/lightningcss-win32-x64-msvc-1.31.1.tgz",
      "integrity": "sha512-I9aiFrbd7oYHwlnQDqr1Roz+fTz61oDDJX7n9tYF9FJymH1cIN1DtKw3iYt6b8WZgEjoNwVSncwF4wx/ZedMhw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lru-cache": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-5.1.1.tgz",
      "integrity": "sha512-KpNARQA3Iwv+jTA0utUVVbrh+Jlrr1Fv0e56GGzAFOXN7dk/FviaDW8LHmK52DlcH4WP2n6gI8vN1aesBFgo9w==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "yallist": "^3.0.2"
      }
    },
    "node_modules/magic-string": {
      "version": "0.30.21",
      "resolved": "https://registry.npmjs.org/magic-string/-/magic-string-0.30.21.tgz",
      "integrity": "sha512-vd2F4YUyEXKGcLHoq+TEyCjxueSeHnFxyyjNp80yg0XV4vUhnDer/lvvlqM/arB5bXQN5K2/3oinyCRyx8T2CQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/sourcemap-codec": "^1.5.5"
      }
    },
    "node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/nanoid": {
      "version": "3.3.11",
      "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.11.tgz",
      "integrity": "sha512-N8SpfPUnUp1bK+PMYW8qSWdl9U+wwNWI4QKxOYDy9JAro3WMX7p2OeVRF9v+347pnakNevPmiHhNmZ2HbFA76w==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "bin": {
        "nanoid": "bin/nanoid.cjs"
      },
      "engines": {
        "node": "^10 || ^12 || ^13.7 || ^14 || >=15.0.1"
      }
    },
    "node_modules/node-releases": {
      "version": "2.0.27",
      "resolved": "https://registry.npmjs.org/node-releases/-/node-releases-2.0.27.tgz",
      "integrity": "sha512-nmh3lCkYZ3grZvqcCH+fjmQ7X+H0OeZgP40OierEaAptX4XofMh5kwNbWh7lBduUzCcV/8kZ+NDLCwm2iorIlA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/picocolors": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz",
      "integrity": "sha512-xceH2snhtb5M9liqDsmEw56le376mTZkEX/jEb/RxNFyegNul7eNslCXP9FDj/Lcu0X8KEyMceP2ntpaHrDEVA==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/picomatch": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.3.tgz",
      "integrity": "sha512-5gTmgEY/sqK6gFXLIsQNH19lWb4ebPDLA4SdLP7dsWkIXHWlG66oPuVvXSGFPppYZz8ZDZq0dYYrbHfBCVUb1Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/postcss": {
      "version": "8.5.6",
      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.5.6.tgz",
      "integrity": "sha512-3Ybi1tAuwAP9s0r1UQ2J4n5Y0G05bJkpUIO0/bI9MhwmD70S5aTWbXGBwxHrelT+XM1k6dM0pk+SwNkpTRN7Pg==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/postcss"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "nanoid": "^3.3.11",
        "picocolors": "^1.1.1",
        "source-map-js": "^1.2.1"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      }
    },
    "node_modules/react": {
      "version": "19.2.4",
      "resolved": "https://registry.npmjs.org/react/-/react-19.2.4.tgz",
      "integrity": "sha512-9nfp2hYpCwOjAN+8TZFGhtWEwgvWHXqESH8qT89AT/lWklpLON22Lc8pEtnpsZz7VmawabSU0gCjnj8aC0euHQ==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/react-dom": {
      "version": "19.2.4",
      "resolved": "https://registry.npmjs.org/react-dom/-/react-dom-19.2.4.tgz",
      "integrity": "sha512-AXJdLo8kgMbimY95O2aKQqsz2iWi9jMgKJhRBAxECE4IFxfcazB2LmzloIoibJI3C12IlY20+KFaLv+71bUJeQ==",
      "license": "MIT",
      "dependencies": {
        "scheduler": "^0.27.0"
      },
      "peerDependencies": {
        "react": "^19.2.4"
      }
    },
    "node_modules/react-refresh": {
      "version": "0.18.0",
      "resolved": "https://registry.npmjs.org/react-refresh/-/react-refresh-0.18.0.tgz",
      "integrity": "sha512-QgT5//D3jfjJb6Gsjxv0Slpj23ip+HtOpnNgnb2S5zU3CB26G/IDPGoy4RJB42wzFE46DRsstbW6tKHoKbhAxw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/rollup": {
      "version": "4.59.0",
      "resolved": "https://registry.npmjs.org/rollup/-/rollup-4.59.0.tgz",
      "integrity": "sha512-2oMpl67a3zCH9H79LeMcbDhXW/UmWG/y2zuqnF2jQq5uq9TbM9TVyXvA4+t+ne2IIkBdrLpAaRQAvo7YI/Yyeg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/estree": "1.0.8"
      },
      "bin": {
        "rollup": "dist/bin/rollup"
      },
      "engines": {
        "node": ">=18.0.0",
        "npm": ">=8.0.0"
      },
      "optionalDependencies": {
        "@rollup/rollup-android-arm-eabi": "4.59.0",
        "@rollup/rollup-android-arm64": "4.59.0",
        "@rollup/rollup-darwin-arm64": "4.59.0",
        "@rollup/rollup-darwin-x64": "4.59.0",
        "@rollup/rollup-freebsd-arm64": "4.59.0",
        "@rollup/rollup-freebsd-x64": "4.59.0",
        "@rollup/rollup-linux-arm-gnueabihf": "4.59.0",
        "@rollup/rollup-linux-arm-musleabihf": "4.59.0",
        "@rollup/rollup-linux-arm64-gnu": "4.59.0",
        "@rollup/rollup-linux-arm64-musl": "4.59.0",
        "@rollup/rollup-linux-loong64-gnu": "4.59.0",
        "@rollup/rollup-linux-loong64-musl": "4.59.0",
        "@rollup/rollup-linux-ppc64-gnu": "4.59.0",
        "@rollup/rollup-linux-ppc64-musl": "4.59.0",
        "@rollup/rollup-linux-riscv64-gnu": "4.59.0",
        "@rollup/rollup-linux-riscv64-musl": "4.59.0",
        "@rollup/rollup-linux-s390x-gnu": "4.59.0",
        "@rollup/rollup-linux-x64-gnu": "4.59.0",
        "@rollup/rollup-linux-x64-musl": "4.59.0",
        "@rollup/rollup-openbsd-x64": "4.59.0",
        "@rollup/rollup-openharmony-arm64": "4.59.0",
        "@rollup/rollup-win32-arm64-msvc": "4.59.0",
        "@rollup/rollup-win32-ia32-msvc": "4.59.0",
        "@rollup/rollup-win32-x64-gnu": "4.59.0",
        "@rollup/rollup-win32-x64-msvc": "4.59.0",
        "fsevents": "~2.3.2"
      }
    },
    "node_modules/scheduler": {
      "version": "0.27.0",
      "resolved": "https://registry.npmjs.org/scheduler/-/scheduler-0.27.0.tgz",
      "integrity": "sha512-eNv+WrVbKu1f3vbYJT/xtiF5syA5HPIMtf9IgY/nKg0sWqzAUEvqY/xm7OcZc/qafLx/iO9FgOmeSAp4v5ti/Q==",
      "license": "MIT"
    },
    "node_modules/semver": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/source-map-js": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/source-map-js/-/source-map-js-1.2.1.tgz",
      "integrity": "sha512-UXWMKhLOwVKb728IUtQPXxfYU+usdybtUrK/8uGE8CQMvrhOpwvzDBwj0QhSL7MQc7vIsISBG8VQ8+IDQxpfQA==",
      "dev": true,
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/tailwindcss": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/tailwindcss/-/tailwindcss-4.2.1.tgz",
      "integrity": "sha512-/tBrSQ36vCleJkAOsy9kbNTgaxvGbyOamC30PRePTQe/o1MFwEKHQk4Cn7BNGaPtjp+PuUrByJehM1hgxfq4sw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/tapable": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/tapable/-/tapable-2.3.0.tgz",
      "integrity": "sha512-g9ljZiwki/LfxmQADO3dEY1CbpmXT5Hm2fJ+QaGKwSXUylMybePR7/67YW7jOrrvjEgL1Fmz5kzyAjWVWLlucg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      }
    },
    "node_modules/tinyglobby": {
      "version": "0.2.15",
      "resolved": "https://registry.npmjs.org/tinyglobby/-/tinyglobby-0.2.15.tgz",
      "integrity": "sha512-j2Zq4NyQYG5XMST4cbs02Ak8iJUdxRM0XI5QyxXuZOzKOINmWurp3smXu3y5wDcJrptwpSjgXHzIQxR0omXljQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fdir": "^6.5.0",
        "picomatch": "^4.0.3"
      },
      "engines": {
        "node": ">=12.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/SuperchupuDev"
      }
    },
    "node_modules/typescript": {
      "version": "5.9.3",
      "resolved": "https://registry.npmjs.org/typescript/-/typescript-5.9.3.tgz",
      "integrity": "sha512-jl1vZzPDinLr9eUt3J/t7V6FgNEw9QjvBPdysz9KfQDD41fQrC2Y4vKQdiaUpFT4bXlb1RHhLpp8wtm6M5TgSw==",
      "dev": true,
      "license": "Apache-2.0",
      "bin": {
        "tsc": "bin/tsc",
        "tsserver": "bin/tsserver"
      },
      "engines": {
        "node": ">=14.17"
      }
    },
    "node_modules/update-browserslist-db": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/update-browserslist-db/-/update-browserslist-db-1.2.3.tgz",
      "integrity": "sha512-Js0m9cx+qOgDxo0eMiFGEueWztz+d4+M3rGlmKPT+T4IS/jP4ylw3Nwpu6cpTTP8R1MAC1kF4VbdLt3ARf209w==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/browserslist"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "escalade": "^3.2.0",
        "picocolors": "^1.1.1"
      },
      "bin": {
        "update-browserslist-db": "cli.js"
      },
      "peerDependencies": {
        "browserslist": ">= 4.21.0"
      }
    },
    "node_modules/vite": {
      "version": "7.3.1",
      "resolved": "https://registry.npmjs.org/vite/-/vite-7.3.1.tgz",
      "integrity": "sha512-w+N7Hifpc3gRjZ63vYBXA56dvvRlNWRczTdmCBBa+CotUzAPf5b7YMdMR/8CQoeYE5LX3W4wj6RYTgonm1b9DA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "esbuild": "^0.27.0",
        "fdir": "^6.5.0",
        "picomatch": "^4.0.3",
        "postcss": "^8.5.6",
        "rollup": "^4.43.0",
        "tinyglobby": "^0.2.15"
      },
      "bin": {
        "vite": "bin/vite.js"
      },
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      },
      "funding": {
        "url": "https://github.com/vitejs/vite?sponsor=1"
      },
      "optionalDependencies": {
        "fsevents": "~2.3.3"
      },
      "peerDependencies": {
        "@types/node": "^20.19.0 || >=22.12.0",
        "jiti": ">=1.21.0",
        "less": "^4.0.0",
        "lightningcss": "^1.21.0",
        "sass": "^1.70.0",
        "sass-embedded": "^1.70.0",
        "stylus": ">=0.54.8",
        "sugarss": "^5.0.0",
        "terser": "^5.16.0",
        "tsx": "^4.8.1",
        "yaml": "^2.4.2"
      },
      "peerDependenciesMeta": {
        "@types/node": {
          "optional": true
        },
        "jiti": {
          "optional": true
        },
        "less": {
          "optional": true
        },
        "lightningcss": {
          "optional": true
        },
        "sass": {
          "optional": true
        },
        "sass-embedded": {
          "optional": true
        },
        "stylus": {
          "optional": true
        },
        "sugarss": {
          "optional": true
        },
        "terser": {
          "optional": true
        },
        "tsx": {
          "optional": true
        },
        "yaml": {
          "optional": true
        }
      }
    },
    "node_modules/yallist": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/yallist/-/yallist-3.1.1.tgz",
      "integrity": "sha512-a4UGQaWPH59mOXUYnAG2ewncQS4i4F43Tv3JoAM+s2VDAmS9NsK8GpDMLrCHPksFT7h3K6TOoUNn2pb7RoXx4g==",
      "dev": true,
      "license": "ISC"
    }
  }
}

```

## package.json

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build && node -e \"const fs=require('fs');const p='dist/index.html';fs.writeFileSync(p, fs.readFileSync(p,'utf8').replace(/ crossorigin/g,''))\"",
    "preview": "vite preview"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.2.1",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.4",
    "tailwindcss": "^4.2.1",
    "typescript": "~5.9.3",
    "vite": "^7.3.1"
  },
  "dependencies": {
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  }
}
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "allowJs": true
  },
  "include": ["src"]
}

```

## src\App.jsx

```jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ActivityBar from './components/ActivityBar';
import StatusBar from './components/StatusBar';
import TelemetryBar from './components/TelemetryBar';
import TabBar from './components/TabBar';
import BottomPanel from './components/BottomPanel';
import FileExplorer from './components/FileExplorer';
import FileEditor from './components/FileEditor';
import SettingsPanel from './components/SettingsPanel';
import ExtensionPanel from './components/ExtensionPanel';
import OnboardingModal from './components/OnboardingModal';
import { fetchConfig, fetchDashboard, getFileTree, readFile } from './services/api';

function TelemetrySidebarContent() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = () => {
            fetchDashboard()
                .then(d => { setData(d); setLoading(false); })
                .catch(() => setLoading(false));
        };
        load();
        const id = setInterval(load, 10000);
        return () => clearInterval(id);
    }, []);

    if (loading) return <p className="panel-hint" style={{ fontSize: '11px' }}>Carregando telemetria...</p>;
    if (!data) return <p className="panel-hint" style={{ fontSize: '11px' }}>Não foi possível carregar a telemetria.</p>;

    const totalTokens = data.total_tokens || 0;
    const costSaved = (totalTokens * 0.00001).toFixed(4);

    return (
        <>
            <div style={{ background: 'var(--bg-overlay)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status Ollama</span>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>● Conectado</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tokens Totais</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{totalTokens.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Economia estimada</span>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>${costSaved}</span>
                </div>
            </div>
            {data.recent_calls && data.recent_calls.length > 0 && (
                <div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>CHAMADAS RECENTES</span>
                    <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {data.recent_calls.slice(0, 8).map((call, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', padding: '3px 6px', background: 'var(--bg-overlay)', borderRadius: '3px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{call.model || 'local'}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{call.tokens || 0} tok</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div style={{ background: 'var(--bg-overlay)', borderRadius: '6px', padding: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>📈 DISTRIBUIÇÃO</span>
                <div style={{ marginTop: '8px', display: 'flex', gap: '4px', height: '20px' }}>
                    <div style={{ flex: data.prompt_tokens || 1, background: 'var(--accent)', borderRadius: '3px', opacity: 0.5 }} title={`Prompt: ${data.prompt_tokens || 0}`} />
                    <div style={{ flex: data.completion_tokens || 1, background: 'var(--accent-green)', borderRadius: '3px', opacity: 0.5 }} title={`Completion: ${data.completion_tokens || 0}`} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
                    <span>Prompt</span>
                    <span>Completion</span>
                </div>
            </div>
        </>
    );
}

export default function App() {
    const [mode, setMode] = useState('local');
    const [model, setModel] = useState('');
    const [workspace, setWorkspace] = useState(null);
    const [tokenCount, setTokenCount] = useState(0);

    // Panels
    const [activePanel, setActivePanel] = useState('explorer');
    const [bottomVisible, setBottomVisible] = useState(true);

    // Tabs (multi-file)
    const [openTabs, setOpenTabs] = useState([]);
    const [activeTab, setActiveTab] = useState(null);

    // Agent context
    const [promptFiles, setPromptFiles] = useState([]);       // .txt prompt guides
    const [contextFiles, setContextFiles] = useState([]);     // context files attached by user

    // Telemetry sidebar
    const [telemetryData, setTelemetryData] = useState(null);

    // Refs
    const explorerRef = useRef(null);

    // Load config on mount
    useEffect(() => {
        fetchConfig()
            .then(cfg => {
                if (cfg.selected_model) setModel(cfg.selected_model);
            })
            .catch(() => { });
    }, []);

    // Track workspace from explorer
    useEffect(() => {
        const interval = setInterval(() => {
            const path = explorerRef.current?.getWorkspacePath?.();
            if (path && path !== workspace) setWorkspace(path);
        }, 2000);
        return () => clearInterval(interval);
    }, [workspace]);

    // ── Keyboard Shortcuts (VS Code-like) ──────────────────────────
    useEffect(() => {
        const handler = (e) => {
            // Ctrl+` → Toggle bottom panel (terminal/AI)
            if (e.ctrlKey && e.key === '`') {
                e.preventDefault();
                setBottomVisible(v => !v);
            }
            // Ctrl+Shift+E → Explorer
            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                setActivePanel(p => p === 'explorer' ? null : 'explorer');
            }
            // Ctrl+Shift+F → (removed, now Ctrl+F is in-file search handled by FileEditor)
            // Ctrl+Shift+X → Extensions
            if (e.ctrlKey && e.shiftKey && e.key === 'X') {
                e.preventDefault();
                setActivePanel(p => p === 'extensions' ? null : 'extensions');
            }
            // Ctrl+B → Toggle sidebar
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                setActivePanel(p => p ? null : 'explorer');
            }
            // Ctrl+, → Settings
            if (e.ctrlKey && e.key === ',') {
                e.preventDefault();
                handleOpenSettings();
            }
            // Ctrl+W → Close active tab
            if (e.ctrlKey && e.key === 'w') {
                e.preventDefault();
                if (activeTab) handleCloseTab(activeTab);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [activeTab]);

    // Open Settings Tab
    const handleOpenSettings = useCallback(() => {
        const settingsPath = 'lumina://settings';
        const existing = openTabs.find(t => t.path === settingsPath);
        if (!existing) {
            setOpenTabs(prev => [...prev, { path: settingsPath, name: 'Configurações', ext: 'sys', is_special: true }]);
        }
        setActiveTab(settingsPath);
        setActivePanel(null); // Close sidebar for clean view
    }, [openTabs]);

    // Open file in tab
    const handleFileSelect = useCallback((fileData) => {
        const existing = openTabs.find(t => t.path === fileData.path);
        if (!existing) {
            setOpenTabs(prev => [...prev, { ...fileData, modified: false }]);
        }
        setActiveTab(fileData.path);
    }, [openTabs]);

    // Close tab
    const handleCloseTab = useCallback((path) => {
        setOpenTabs(prev => {
            const newTabs = prev.filter(t => t.path !== path);
            if (activeTab === path) {
                setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1].path : null);
            }
            return newTabs;
        });
    }, [activeTab]);

    // When AI creates files → refresh explorer
    const handleFilesCreated = useCallback((files) => {
        setTimeout(() => explorerRef.current?.refresh(), 500);
        setTokenCount(prev => prev + files.length);
    }, []);

    // Get the active file data
    const activeFileData = openTabs.find(t => t.path === activeTab) || null;

    return (
        <div className="ide-layout">
            {/* ─── Telemetry Bar (top) ────────────────────────── */}
            <TelemetryBar mode={mode} model={model} />

            {/* ─── Activity Bar (far left icons) ──────────────── */}
            <ActivityBar
                activePanel={activePanel}
                onPanelChange={(id) => {
                    if (id === 'settings') {
                        handleOpenSettings();
                    } else {
                        setActivePanel(id);
                    }
                }}
            />

            {/* ─── Side Panel ─────────────────────────────────── */}
            {activePanel && (
                <aside className="side-panel">
                    {activePanel === 'explorer' && (
                        <FileExplorer
                            ref={explorerRef}
                            onFileSelect={handleFileSelect}
                            activeFile={activeTab}
                        />
                    )}
                    {activePanel === 'ai' && (
                        <div className="panel-placeholder">
                            <div className="panel-header">AGENT — CONTEXTO & PROMPTS</div>
                            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
                                {/* Custom Prompt Files */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>📝 PROMPTS & PLANEJAMENTO</span>
                                        <label style={{ cursor: 'pointer', fontSize: '16px', color: 'var(--accent)' }} title="Gerenciar Planejamento (Adicionar .md ou .txt)">
                                            +
                                            <input type="file" accept=".txt,.md" multiple style={{ display: 'none' }} onChange={(e) => {
                                                const files = Array.from(e.target.files || []);
                                                files.forEach(f => {
                                                    const reader = new FileReader();
                                                    reader.onload = () => {
                                                        setPromptFiles(prev => [...prev, { name: f.name, content: reader.result }]);
                                                    };
                                                    reader.readAsText(f);
                                                });
                                                e.target.value = '';
                                            }} />
                                        </label>
                                    </div>
                                    {promptFiles.length === 0 ? (
                                        <p className="panel-hint" style={{ fontSize: '11px' }}>Nenhum prompt carregado. Adicione arquivos .txt para guiar o modelo.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {promptFiles.map((pf, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: 'var(--bg-overlay)', borderRadius: '4px', fontSize: '11px' }}>
                                                    <span style={{ color: 'var(--accent-green)' }}>📄</span>
                                                    <span style={{ flex: 1, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pf.name}</span>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{Math.round(pf.content.length / 1024)}KB</span>
                                                    <button onClick={() => setPromptFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '12px', padding: '0 2px' }}>✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Context Files (Read-only view in sidebar) */}
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>📎 ARQUIVOS DE CONTEXTO</span>
                                    </div>
                                    <p className="panel-hint" style={{ fontSize: '11px', marginBottom: '6px' }}>
                                        Adicione arquivos ou pastas de contexto pelos botões acima do chat.
                                    </p>
                                    {contextFiles.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {contextFiles.map((cf, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: 'var(--bg-overlay)', borderRadius: '4px', fontSize: '11px' }}>
                                                    <span>{cf.is_dir ? '📂' : '📄'}</span>
                                                    <span style={{ flex: 1, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cf.name}</span>
                                                    <button onClick={() => setContextFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '12px', padding: '0 2px' }}>✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {activePanel === 'telemetry' && (
                        <div className="panel-placeholder">
                            <div className="panel-header">TELEMETRIA</div>
                            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <TelemetrySidebarContent />
                            </div>
                        </div>
                    )}
                    {activePanel === 'extensions' && <ExtensionPanel />}
                </aside>
            )}

            {/* ─── Editor Area ─────────────────────────────────── */}
            <main className="editor-area">
                <TabBar
                    tabs={openTabs}
                    activeTab={activeTab}
                    onSelect={setActiveTab}
                    onClose={handleCloseTab}
                />

                <div className="editor-content">
                    {activeTab === 'lumina://settings' ? (
                        <SettingsPanel />
                    ) : activeFileData ? (
                        <FileEditor
                            file={activeFileData}
                            onClose={() => handleCloseTab(activeFileData.path)}
                            onSaved={() => {
                                setOpenTabs(prev => prev.map(t =>
                                    t.path === activeFileData.path ? { ...t, modified: false } : t
                                ));
                            }}
                        />
                    ) : (
                        <div className="welcome-screen">
                            <img src="/Luminalogo.png" alt="Lumina" className="welcome-logo-img lumina-icon" />
                            <h2 className="welcome-title">Lumina IDE</h2>
                            <p className="welcome-sub">Local Intelligence, Global Performance</p>
                            <div className="welcome-actions">
                                <div className="welcome-shortcut">
                                    <kbd>Ctrl+Shift+E</kbd>
                                    <span>Abrir Explorer</span>
                                </div>
                                <div className="welcome-shortcut">
                                    <kbd>Ctrl+`</kbd>
                                    <span>Painel do Agent</span>
                                </div>
                                <div className="welcome-shortcut">
                                    <kbd>Ctrl+B</kbd>
                                    <span>Toggle Sidebar</span>
                                </div>
                                <div className="welcome-shortcut">
                                    <kbd>Ctrl+,</kbd>
                                    <span>Configurações</span>
                                </div>
                                <div className="welcome-shortcut">
                                    <kbd>Ctrl+W</kbd>
                                    <span>Fechar aba</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── Bottom Panel (AI + Output) ────────────────── */}
                {bottomVisible && (
                    <BottomPanel
                        mode={mode}
                        promptFiles={promptFiles}
                        onFilesCreated={handleFilesCreated}
                        workspace={workspace}
                    />
                )}
            </main>

            {/* ─── Status Bar ──────────────────────────────────── */}
            <StatusBar
                mode={mode}
                model={model}
                workspace={workspace}
                tokenCount={tokenCount}
            />

            <OnboardingModal onComplete={() => console.log('Onboarding complete')} />
        </div>
    );
}

```

## src\main.jsx

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './style.css';

// Restore saved theme before first paint
const savedTheme = localStorage.getItem('lumina-theme');
if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

```

## src\style.css

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

/* ═══════════════════════════════════════════════════════════════════
   Lumina IDE — Design System
   Catppuccin-inspired dark theme with neural neon accents
   ═══════════════════════════════════════════════════════════════════ */
:root {
  --bg-base: #1e1e2e;
  --bg-surface: #181825;
  --bg-overlay: #11111b;
  --bg-mantle: #1a1a2e;
  --bg-crust: #131320;
  --bg-hover: rgba(255, 255, 255, 0.04);
  --bg-active: rgba(137, 180, 250, 0.08);

  --border: rgba(255, 255, 255, 0.06);
  --border-active: rgba(137, 180, 250, 0.4);

  --text: #cdd6f4;
  --text-secondary: #a6adc8;
  --text-muted: #585b70;
  --text-accent: #b4befe;

  --accent: #89b4fa;
  --accent-secondary: #b4befe;
  --accent-green: #a6e3a1;
  --accent-red: #f38ba8;
  --accent-yellow: #f9e2af;
  --accent-peach: #fab387;
  --accent-mauve: #cba6f7;

  --lumen-glow: 0 0 12px rgba(137, 180, 250, 0.3);
  --lumen-bg: rgba(137, 180, 250, 0.04);

  --radius: 6px;
  --transition: 0.15s ease;
}

/* ═══════════════════════════════════════════════════════════════════
   Light Theme
   ═══════════════════════════════════════════════════════════════════ */
[data-theme='light'] {
  --bg-base: #eff1f5;
  --bg-surface: #e6e9ef;
  --bg-overlay: #dce0e8;
  --bg-mantle: #ccd0da;
  --bg-crust: #bcc0cc;
  --bg-hover: rgba(0, 0, 0, 0.04);
  --bg-active: rgba(30, 102, 245, 0.08);

  --border: rgba(0, 0, 0, 0.08);
  --border-active: rgba(30, 102, 245, 0.35);

  --text: #4c4f69;
  --text-secondary: #5c5f77;
  --text-muted: #9ca0b0;
  --text-accent: #1e66f5;

  --accent: #1e66f5;
  --accent-secondary: #7287fd;
  --accent-green: #40a02b;
  --accent-red: #d20f39;
  --accent-yellow: #df8e1d;
  --accent-peach: #fe640b;
  --accent-mauve: #8839ef;

  --lumen-glow: 0 0 12px rgba(30, 102, 245, 0.2);
  --lumen-bg: rgba(30, 102, 245, 0.04);
}

/* ═══════════════════════════════════════════════════════════════════
   Lumina Icon (Rounded Logo Cut)
   ═══════════════════════════════════════════════════════════════════ */
.lumina-icon {
  box-shadow: 0 0 20px rgba(137, 180, 250, 0.15);
}

.lumina-icon.sm {
  width: 20px;
  height: 20px;
}

.lumina-icon.md {
  width: 48px;
  height: 48px;
}

.lumina-icon.lg {
  width: 80px;
  height: 80px;
}

.lumina-icon.xl {
  width: 120px;
  height: 120px;
}

[data-theme='light'] .lumina-icon {
  border-color: rgba(30, 102, 245, 0.2);
  box-shadow: 0 0 20px rgba(30, 102, 245, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#root {
  height: 100%;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 13px;
  background: var(--bg-base);
  color: var(--text);
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* ═══════════════════════════════════════════════════════════════════
   IDE Layout Grid
   ═══════════════════════════════════════════════════════════════════ */
.ide-layout {
  display: grid;
  grid-template-columns: 48px auto 1fr;
  grid-template-rows: 36px 1fr 22px;
  grid-template-areas:
    "telemetry telemetry telemetry"
    "activity  side      editor"
    "status    status    status";
  height: 100vh;
  width: 100vw;
}

/* ═══════════════════════════════════════════════════════════════════
   Telemetry Bar (top)
   ═══════════════════════════════════════════════════════════════════ */
.telemetry-bar {
  grid-area: telemetry;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: var(--bg-overlay);
  border-bottom: 1px solid var(--border);
  -webkit-app-region: drag;
  /* For Electron drag */
}

.telemetry-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.telemetry-logo {
  width: 20px;
  height: 20px;
  border-radius: 20%;
  object-fit: cover;
}

.telemetry-brand {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--accent);
}

.telemetry-center {
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: no-drag;
}

.telemetry-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  color: var(--text-secondary);
}

.telemetry-chip .chip-icon {
  font-size: 12px;
}

.telemetry-chip .chip-label {
  font-weight: 500;
}

.telemetry-chip .chip-unit {
  color: var(--text-muted);
  font-size: 10px;
}

.telemetry-chip .chip-model {
  color: var(--accent);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.connected {
  background: var(--accent-green);
  box-shadow: 0 0 6px var(--accent-green);
}

.status-dot.checking {
  background: var(--accent-yellow);
  animation: pulse 1s infinite;
}

.status-dot.disconnected {
  background: var(--accent-red);
}

.telemetry-chip.savings .chip-label {
  color: var(--accent-green);
}

.telemetry-chip.tokens .chip-label {
  color: var(--accent);
}

.telemetry-right {
  color: var(--text-muted);
  font-size: 11px;
}

/* ═══════════════════════════════════════════════════════════════════
   Activity Bar (far left)
   ═══════════════════════════════════════════════════════════════════ */
.activity-bar {
  grid-area: activity;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg-overlay);
  border-right: 1px solid var(--border);
  padding: 4px 0;
}

.activity-bar-top {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.activity-bar-bottom {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 4px;
}

.activity-btn {
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.45;
  transition: opacity var(--transition);
}

.activity-btn:hover {
  opacity: 0.75;
  background: var(--bg-hover);
}

.activity-btn.active {
  opacity: 1;
}

.activity-icon {
  font-size: 20px;
  filter: grayscale(0.2);
}

.activity-btn.active .activity-icon {
  filter: none;
}

.activity-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 24px;
  background: var(--accent);
  border-radius: 0 2px 2px 0;
}

/* ═══════════════════════════════════════════════════════════════════
   Side Panel
   ═══════════════════════════════════════════════════════════════════ */
.side-panel {
  grid-area: side;
  width: 260px;
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Side-panel content containers (Agent, Telemetry, etc.) */
.panel-placeholder {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.2px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
  user-select: none;
  flex-shrink: 0;
}

.panel-hint {
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.5;
  margin: 0;
}

/* ═══════════════════════════════════════════════════════════════════
   File Explorer
   ═══════════════════════════════════════════════════════════════════ */
.file-explorer {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.explorer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  user-select: none;
}

.explorer-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.2px;
  color: var(--text-secondary);
}

.explorer-actions {
  display: flex;
  gap: 2px;
}

.explorer-action {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 3px;
  font-size: 12px;
  opacity: 0.5;
  transition: all var(--transition);
}

.explorer-action:hover {
  opacity: 1;
  background: var(--bg-hover);
}

.explorer-input-row {
  display: flex;
  gap: 4px;
  padding: 4px 8px 8px;
}

.explorer-input-row input {
  flex: 1;
  background: var(--bg-overlay);
  border: 1px solid var(--border-active);
  border-radius: var(--radius);
  padding: 4px 8px;
  color: var(--text);
  font-size: 11px;
  outline: none;
}

.explorer-input-row button {
  background: var(--accent);
  color: var(--bg-overlay);
  border: none;
  border-radius: var(--radius);
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.explorer-workspace {
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text);
  background: var(--bg-hover);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.explorer-tree {
  flex: 1;
  overflow-y: auto;
  padding: 2px 0;
}

.explorer-loading,
.explorer-empty {
  padding: 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
}

.explorer-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 32px 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
}

.empty-icon {
  font-size: 28px;
  opacity: 0.3;
}

.btn-primary {
  padding: 6px 16px;
  background: var(--accent);
  color: var(--bg-overlay);
  border: none;
  border-radius: var(--radius);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  filter: brightness(1.1);
}

.btn-ghost {
  padding: 5px 14px;
  background: none;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 11px;
  cursor: pointer;
}

.btn-ghost:hover {
  background: var(--bg-hover);
}

/* Tree */
.tree-label {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  transition: background var(--transition);
}

.tree-label:hover {
  background: var(--bg-hover);
}

.tree-label.active {
  background: var(--bg-active);
  color: var(--text-accent);
}

.tree-arrow {
  font-size: 9px;
  width: 12px;
  text-align: center;
  color: var(--text-muted);
}

.tree-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.tree-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ═══════════════════════════════════════════════════════════════════
   Editor Area
   ═══════════════════════════════════════════════════════════════════ */
.editor-area {
  grid-area: editor;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-base);
}

/* Tab Bar */
.tab-bar {
  display: flex;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  min-height: 35px;
}

.tab-list {
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
}

.tab-list::-webkit-scrollbar {
  display: none;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 35px;
  font-size: 12px;
  cursor: pointer;
  border-right: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-muted);
  white-space: nowrap;
  transition: all var(--transition);
  position: relative;
}

.tab:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.tab.active {
  background: var(--bg-base);
  color: var(--text);
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent);
}

.tab-icon {
  font-size: 13px;
}

.tab-label {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-dot {
  color: var(--accent-yellow);
  font-size: 9px;
}

.tab-close-btn {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  border-radius: 3px;
  opacity: 0;
  transition: all var(--transition);
}

.tab:hover .tab-close-btn {
  opacity: 1;
}

.tab-close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text);
}

/* Editor content */
.editor-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ═══════════════════════════════════════════════════════════════════
   File Editor
   ═══════════════════════════════════════════════════════════════════ */
.file-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-base);
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-secondary);
  min-height: 30px;
}

.editor-toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.editor-filename {
  font-weight: 500;
  color: var(--text);
}

.editor-modified-dot {
  color: var(--accent-yellow);
  font-size: 10px;
}

.editor-lang {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  background: var(--bg-hover);
  color: var(--text-muted);
}

.editor-info {
  font-size: 11px;
  color: var(--text-muted);
}

.editor-save-btn {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  opacity: 0.5;
  padding: 2px;
}

.editor-save-btn:hover:not(:disabled) {
  opacity: 1;
}

.editor-save-btn:disabled {
  opacity: 0.2;
  cursor: default;
}

/* Autocomplete Toggle */
.autocomplete-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--bg-overlay);
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  font-size: 11px;
  color: var(--text-muted);
  transition: all var(--transition);
}

.autocomplete-toggle.on {
  border-color: var(--accent-green);
  color: var(--accent-green);
}

.autocomplete-toggle .toggle-icon {
  font-size: 12px;
}

.autocomplete-toggle .toggle-label {
  font-weight: 500;
}

.toggle-switch {
  width: 20px;
  height: 10px;
  border-radius: 5px;
  background: var(--text-muted);
  position: relative;
  transition: background var(--transition);
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 1px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
  transition: transform var(--transition);
}

.toggle-switch.on {
  background: var(--accent-green);
}

.toggle-switch.on::after {
  transform: translateX(10px);
}

.save-indicator {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 3px;
}

.save-indicator.saved {
  color: var(--accent-green);
}

.save-indicator.saving {
  color: var(--accent-yellow);
}

.save-indicator.error {
  color: var(--accent-red);
}

/* Code Area */
.code-area {
  flex: 1;
  display: flex;
  overflow: auto;
  font-family: 'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 20px;
}

.line-numbers {
  padding: 8px 12px 8px 16px;
  text-align: right;
  color: var(--text-muted);
  user-select: none;
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  min-width: 48px;
}

.line-num {
  height: 20px;
  line-height: 20px;
  transition: all var(--transition);
}

/* Lúmen Glow — AI-generated lines */
.line-num.lumen-glow {
  color: var(--accent);
  text-shadow: var(--lumen-glow);
  background: var(--lumen-bg);
}

.code-textarea {
  flex: 1;
  padding: 8px 16px;
  background: transparent;
  border: none;
  color: var(--text);
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  resize: none;
  outline: none;
  tab-size: 4;
  white-space: pre;
  overflow-wrap: normal;
  overflow-x: auto;
}

/* Code Editor Wrapper (for ghost text positioning) */
.code-editor-wrapper {
  flex: 1;
  position: relative;
  overflow: auto;
}

.code-editor-wrapper .code-textarea {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

/* ═══════════════════════════════════════════════════════════════════
   Find-in-File Bar
   ═══════════════════════════════════════════════════════════════════ */
.find-bar {
  padding: 6px 12px;
  background: var(--bg-overlay);
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
}

.find-bar-inner {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--bg-surface);
  border: 1px solid var(--border-active);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  max-width: 400px;
  width: 100%;
}

.find-icon {
  font-size: 13px;
  opacity: 0.6;
}

.find-input {
  flex: 1;
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 4px 8px;
  color: var(--text);
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  outline: none;
  min-width: 120px;
}

.find-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px rgba(137, 180, 250, 0.15);
}

.find-count {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  min-width: 60px;
  text-align: center;
}

.find-nav-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 3px;
  font-size: 10px;
  transition: all var(--transition);
}

.find-nav-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text);
}

.find-nav-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.find-close-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 3px;
  font-size: 12px;
  transition: all var(--transition);
}

.find-close-btn:hover {
  background: rgba(243, 139, 168, 0.15);
  color: var(--accent-red);
}

/* Find match highlight on line numbers */
.line-num.find-highlight-line {
  background: rgba(249, 226, 175, 0.08);
  color: var(--accent-yellow);
}

/* ═══════════════════════════════════════════════════════════════════
   Ghost Text (Autocomplete)
   ═══════════════════════════════════════════════════════════════════ */
.ghost-overlay {
  position: absolute;
  pointer-events: none;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ghost-text {
  color: rgba(137, 180, 250, 0.35);
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 20px;
  white-space: pre;
}

.ghost-hint {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(137, 180, 250, 0.12);
  color: rgba(137, 180, 250, 0.6);
  font-family: 'Inter', sans-serif;
  border: 1px solid rgba(137, 180, 250, 0.15);
}

.ghost-loading {
  font-size: 11px;
  animation: pulse 1s infinite;
}

/* ═══════════════════════════════════════════════════════════════════
   Welcome Screen
   ═══════════════════════════════════════════════════════════════════ */
.welcome-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  opacity: 0.7;
}

.welcome-logo-img {
  width: 80px;
  height: 80px;
  animation: float 4s ease-in-out infinite;
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}

.welcome-title {
  font-size: 28px;
  font-weight: 300;
  letter-spacing: 6px;
  color: var(--accent);
}

.welcome-sub {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 300;
  letter-spacing: 1px;
}

.welcome-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 28px;
}

.welcome-shortcut {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.welcome-shortcut kbd {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  color: var(--text-muted);
  min-width: 100px;
  text-align: center;
}

/* Terminal Tabs */
.tab-close-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 10px;
  opacity: 0.5;
  transition: all var(--transition);
}

.tab-close-icon:hover {
  background: rgba(255, 255, 255, 0.1);
  opacity: 1;
}

.tab-add-btn {
  font-size: 16px;
  padding: 0 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
}

.tab-add-btn:hover {
  color: var(--text);
  background: var(--bg-hover);
}

/* ═══════════════════════════════════════════════════════════════════
   Bottom Panel (Agent + Terminal + Output)
   ═══════════════════════════════════════════════════════════════════ */
.bottom-panel {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border);
  background: var(--bg-surface);
  min-height: 180px;
  max-height: 50vh;
  height: 260px;
}

.bottom-tabs {
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-bottom: 1px solid var(--border);
  min-height: 35px;
  overflow-x: auto;
  scrollbar-width: none;
}

.bottom-tabs::-webkit-scrollbar {
  display: none;
}

.bottom-tab {
  padding: 8px 14px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: background var(--transition), color var(--transition);
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.bottom-tab:hover {
  color: var(--text-secondary);
  background: var(--bg-hover);
}

.bottom-tab.active {
  color: var(--text);
  border-bottom-color: var(--accent);
  background: var(--bg-active);
}

.streaming-dot {
  width: 6px;
  height: 6px;
  background: var(--accent-green);
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.3;
  }
}

.bottom-tabs-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.bottom-action {
  padding: 2px 8px;
  font-size: 11px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 3px;
}

.bottom-action:hover {
  background: var(--bg-hover);
  color: var(--text);
}

.bottom-action.stop {
  color: var(--accent-red);
}

.bottom-output {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text);
  background: var(--bg-overlay);
}

.bottom-output.terminal {
  background: #0d0d15;
  color: #a6e3a1;
  font-family: 'JetBrains Mono', monospace;
}

.bottom-output.terminal pre {
  margin: 0;
  font-family: inherit;
  font-size: inherit;
}

.bottom-output.streaming {
  border-left: 2px solid var(--accent);
}

.bottom-welcome {
  color: var(--text-muted);
  font-family: 'Inter', sans-serif;
  font-size: 12px;
}

.cursor-blink {
  display: inline-block;
  width: 2px;
  height: 14px;
  background: var(--accent);
  margin-left: 1px;
  animation: blink 1s step-end infinite;
  vertical-align: text-bottom;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

/* File ops */
.file-ops-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 5px 10px;
  border-top: 1px solid var(--border);
}

.file-op-chip {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
}

.file-op-chip.created {
  background: rgba(166, 227, 161, 0.08);
  color: var(--accent-green);
}

.file-op-chip.modified {
  background: rgba(137, 180, 250, 0.08);
  color: var(--accent);
}

.file-op-chip.error {
  background: rgba(243, 139, 168, 0.08);
  color: var(--accent-red);
}

.bottom-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px;
  font-size: 12px;
  color: var(--accent-red);
  border-top: 1px solid rgba(243, 139, 168, 0.15);
  background: rgba(243, 139, 168, 0.03);
}

.bottom-error button {
  background: none;
  border: none;
  color: var(--accent-red);
  cursor: pointer;
  font-size: 14px;
}

/* Prompt */
.bottom-prompt {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border);
  background: linear-gradient(180deg, var(--bg-overlay) 0%, rgba(17, 17, 27, 0.95) 100%);
}

.bottom-prompt-input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  width: 100%;
}

.prompt-mode {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-muted);
  padding-bottom: 4px;
  white-space: nowrap;
}

.prompt-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-green);
}

.prompt-textarea {
  flex: 1;
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 7px 12px;
  color: var(--text);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  line-height: 1.4;
  resize: none;
  outline: none;
  max-height: 100px;
  transition: border-color var(--transition);
}

.prompt-textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px rgba(137, 180, 250, 0.15);
}

.prompt-textarea::placeholder {
  color: var(--text-muted);
}

.prompt-send {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: var(--bg-overlay);
  border: none;
  border-radius: var(--radius);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition);
}

.prompt-send:hover:not(:disabled) {
  filter: brightness(1.15);
  box-shadow: 0 0 8px rgba(137, 180, 250, 0.3);
}

.prompt-send:disabled {
  opacity: 0.25;
  cursor: default;
}

.prompt-send.stop {
  background: var(--accent-red);
}

/* ═══════════════════════════════════════════════════════════════════
   Status Bar
   ═══════════════════════════════════════════════════════════════════ */
.status-bar {
  grid-area: status;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: linear-gradient(90deg, #1a1a2e 0%, #313244 50%, #1a1a2e 100%);
  color: var(--text-secondary);
  font-size: 11px;
  border-top: 1px solid rgba(137, 180, 250, 0.08);
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.status-item.brand {
  opacity: 0.5;
}

/* ═══════════════════════════════════════════════════════════════════
   Settings Panel
   ═══════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════
   Settings Panel (Lumina UX)
   ═══════════════════════════════════════════════════════════════════ */
.settings-view {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.settings-logo {
  width: 64px;
  height: 64px;
  border-radius: 20%;
  overflow: hidden;
  object-fit: cover;
  border: 1px solid rgba(137, 180, 250, 0.2);
  box-shadow: 0 0 20px rgba(137, 180, 250, 0.15);
  filter: drop-shadow(0 0 16px rgba(137, 180, 250, 0.4));
}

.settings-header h2 {
  font-size: 28px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 6px 0;
  letter-spacing: 0.5px;
}

.settings-header p {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}

.settings-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(137, 180, 250, 0.03);
  flex-shrink: 0;
  transition: box-shadow var(--transition), border-color var(--transition);
}

.settings-card:hover {
  border-color: rgba(137, 180, 250, 0.12);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(137, 180, 250, 0.06);
}

.settings-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--bg-overlay);
  border-bottom: 1px solid var(--border);
}

.settings-card-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.settings-card-body {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-row-flex {
  display: flex;
  gap: 24px;
}

.setting-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-field label {
  font-size: 15px;
  color: var(--text-secondary);
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-input {
  width: 100%;
  padding: 14px 18px;
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 16px;
  outline: none;
  font-family: 'JetBrains Mono', monospace;
  transition: all var(--transition);
}

.settings-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(137, 180, 250, 0.15);
  background: var(--bg-hover);
}

.settings-refresh-btn {
  background: var(--bg-base);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 6px 14px;
  border-radius: var(--radius);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition);
}

.settings-refresh-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text);
}

.settings-refresh-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.settings-alert {
  padding: 12px 16px;
  border-radius: var(--radius);
  font-size: 13px;
  margin-bottom: 8px;
}

.settings-alert.error {
  background: rgba(243, 139, 168, 0.1);
  color: var(--accent-red);
  border: 1px solid rgba(243, 139, 168, 0.2);
}

.settings-alert.info {
  background: rgba(137, 180, 250, 0.1);
  color: var(--accent);
  border: 1px solid rgba(137, 180, 250, 0.2);
}

.settings-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.settings-badge.success {
  background: rgba(166, 227, 161, 0.15);
  color: var(--accent-green);
}

.settings-badge.neon {
  background: rgba(137, 180, 250, 0.15);
  color: var(--accent);
  box-shadow: 0 0 8px rgba(137, 180, 250, 0.2);
}

.provider-detected {
  margin-top: 14px;
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.settings-footer {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.settings-save-btn {
  background: var(--accent);
  color: var(--bg-base);
  border: none;
  padding: 12px 24px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
}

.settings-save-btn:hover {
  filter: brightness(1.15);
  box-shadow: 0 0 16px rgba(137, 180, 250, 0.3);
}

.settings-save-btn.saved {
  background: var(--accent-green);
  box-shadow: 0 0 16px rgba(166, 227, 161, 0.3);
}

.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.model-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all var(--transition);
}

.model-card:hover {
  border-color: var(--border-active);
  background: var(--bg-hover);
}

.model-card.selected {
  border-color: var(--accent);
  background: rgba(137, 180, 250, 0.05);
  box-shadow: 0 0 0 1px var(--accent);
}

.model-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.model-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.model-active-badge {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 4px;
  background: var(--accent);
  color: var(--bg-base);
  font-weight: 700;
  letter-spacing: 0.5px;
}

.model-card-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.model-tag {
  font-size: 11px;
  padding: 3px 8px;
  background: var(--bg-overlay);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-muted);
}

.model-tag.size {
  margin-left: auto;
  color: var(--accent-yellow);
  border-color: rgba(249, 226, 175, 0.2);
}

/* Panel placeholder */
.panel-placeholder {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.2px;
  color: var(--text-secondary);
}

.panel-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 12px;
  gap: 8px;
  padding: 16px;
}

.panel-hint {
  text-align: center;
  color: var(--text-muted);
  font-size: 11px;
}

.search-input {
  width: 100%;
  padding: 6px 10px;
  background: var(--bg-overlay);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 12px;
  outline: none;
  margin: 0 12px;
  width: calc(100% - 24px);
}

.search-input:focus {
  border-color: var(--accent);
}

/* Dashboard — hidden (telemetry bar replaces it) */
.dashboard-bar {
  display: none;
}

/* ═══════════════════════════════════════════════════════════════════
   Theme Toggle Buttons
   ═══════════════════════════════════════════════════════════════════ */
.settings-theme-btn {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-base);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.settings-theme-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-active);
}

.settings-theme-btn.active {
  border-color: var(--accent);
  background: rgba(137, 180, 250, 0.08);
  color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent), 0 0 12px rgba(137, 180, 250, 0.1);
}

/* ═══════════════════════════════════════════════════════════════════
   Light Theme — Component Overrides
   ═══════════════════════════════════════════════════════════════════ */
[data-theme='light'] .status-bar {
  background: linear-gradient(90deg, #ccd0da 0%, #bcc0cc 50%, #ccd0da 100%);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

[data-theme='light'] .bottom-output.terminal {
  background: #e6e9ef;
  color: #40a02b;
}

[data-theme='light'] .telemetry-bar {
  background: linear-gradient(135deg, #dce0e8 0%, #ccd0da 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

[data-theme='light'] .activity-bar {
  background: #dce0e8;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
}

[data-theme='light'] .bottom-prompt {
  background: linear-gradient(180deg, #e6e9ef 0%, #dce0e8 100%);
}

[data-theme='light'] .settings-theme-btn.active {
  background: rgba(30, 102, 245, 0.08);
  color: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent), 0 0 12px rgba(30, 102, 245, 0.1);
}

[data-theme='light'] .ghost-text {
  color: rgba(30, 102, 245, 0.3);
}

[data-theme='light'] .ghost-hint {
  background: rgba(30, 102, 245, 0.08);
  color: rgba(30, 102, 245, 0.5);
  border-color: rgba(30, 102, 245, 0.12);
}
```

## src\components\ActivityBar.jsx

```jsx
import React from 'react';

const ITEMS = [
    { id: 'explorer', icon: '📁', label: 'Explorer', shortcut: 'Ctrl+Shift+E' },
    { id: 'ai', icon: '🤖', label: 'Agent', shortcut: 'Ctrl+Shift+A' },
    { id: 'telemetry', icon: '📊', label: 'Telemetria', shortcut: '' },
    { id: 'extensions', icon: '🧩', label: 'Extensões', shortcut: 'Ctrl+Shift+X' },
];

const BOTTOM_ITEMS = [
    { id: 'settings', icon: '⚙️', label: 'Configurações' },
];

export default function ActivityBar({ activePanel, onPanelChange }) {
    return (
        <div className="activity-bar">
            <div className="activity-bar-top">
                {ITEMS.map(item => (
                    <button
                        key={item.id}
                        className={`activity-btn ${activePanel === item.id ? 'active' : ''}`}
                        onClick={() => onPanelChange(activePanel === item.id ? null : item.id)}
                        title={`${item.label} (${item.shortcut})`}
                    >
                        <span className="activity-icon">{item.icon}</span>
                        {activePanel === item.id && <span className="activity-indicator" />}
                    </button>
                ))}
            </div>
            <div className="activity-bar-bottom">
                {BOTTOM_ITEMS.map(item => (
                    <button
                        key={item.id}
                        className={`activity-btn ${activePanel === item.id ? 'active' : ''}`}
                        onClick={() => onPanelChange(activePanel === item.id ? null : item.id)}
                        title={item.label}
                    >
                        <span className="activity-icon">{item.icon}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

```

## src\components\BottomPanel.jsx

```jsx
import React, { useState, useRef, useEffect } from 'react';
import { streamGenerate, getFileTree, readFile } from '../services/api';
import PlanStepper from './PlanStepper';

// Simple UUID generator for Terminal instances
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function BottomPanel({ mode, onFilesCreated, promptFiles = [] }) {
    // ─── AI State ───────────────────────────────────────────
    const [prompt, setPrompt] = useState('');
    const [output, setOutput] = useState('');
    const [streaming, setStreaming] = useState(false);
    const [error, setError] = useState(null);
    const [fileOps, setFileOps] = useState([]);
    const [pendingConfirmation, setPendingConfirmation] = useState(null);
    const [viewingDiff, setViewingDiff] = useState(false);
    const [lastProcessedError, setLastProcessedError] = useState('');
    const [activeModelData, setActiveModelData] = useState(null);

    // AI Refs
    const outputRef = useRef(null);
    const cancelRef = useRef(null);
    const promptRef = useRef(null);

    // ─── Terminal State ─────────────────────────────────────
    // Support multiple terminals
    const [terminals, setTerminals] = useState([{ id: 'term-1', name: 'Terminal 1', output: '', input: '', ws: null, port: '' }]);
    // Use active tab for routing: 'ai', 'output', or 'term-<id>'
    const [activeTab, setActiveTab] = useState('term-1');

    // Rename/Config Modal State
    const [renamingTerm, setRenamingTerm] = useState(null); // id of terminal being renamed
    const [renameInput, setRenameInput] = useState('');
    const [configuringPort, setConfiguringPort] = useState(false); // boolean indicating we show port config

    // Ref to hold WebSocket instances persistently without causing re-renders
    const wsInstances = useRef({});
    const terminalOutputRefs = useRef({});

    // ─── AI Effects ─────────────────────────────────────────
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);

    useEffect(() => {
        if (!process.env.TEST_MODE) {
            import('../services/api').then(api => {
                api.fetchModels?.().then(data => {
                    const m = data?.models?.find(x => x.name === window.localStorage.getItem('lumina_model') || x.name.includes('llama3') || x.name === 'mistral');
                    if (m) setActiveModelData(m);
                }).catch(() => { });
            });
        }
    }, []);

    // ─── Terminal Logic ─────────────────────────────────────
    const initWebSocket = (termId) => {
        if (wsInstances.current[termId]) return;

        // Find terminal definition to extract custom port, or fallback to 'cmd'
        const tObj = terminals.find(t => t.id === termId);
        const portParam = tObj && tObj.port ? tObj.port.trim() : 'cmd';

        const host = window.location.hostname || '127.0.0.1';
        const wsUrl = `ws://127.0.0.1:8000/api/ws/${portParam}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            setTerminals(prev => prev.map(t =>
                t.id === termId ? { ...t, output: t.output + '\r\n[Lumina Terminal Conectado]\r\n' } : t
            ));
        };

        ws.onmessage = (event) => {
            setTerminals(prev => prev.map(t =>
                t.id === termId ? { ...t, output: t.output + event.data } : t
            ));
        };

        ws.onclose = () => {
            setTerminals(prev => prev.map(t =>
                t.id === termId ? { ...t, output: t.output + '\r\n[Terminal Desconectado]\r\n' } : t
            ));
            delete wsInstances.current[termId];
        };

        ws.onerror = () => {
            setTerminals(prev => prev.map(t =>
                t.id === termId ? { ...t, output: t.output + '\r\n[Erro na Conexão do Terminal]\r\n' } : t
            ));
        };

        wsInstances.current[termId] = ws;
    };

    // Auto-scroll active terminal
    useEffect(() => {
        if (activeTab.startsWith('term-')) {
            const ref = terminalOutputRefs.current[activeTab];
            if (ref) ref.scrollTop = ref.scrollHeight;
        }
    }, [terminals, activeTab]);

    // Connect WS when switched
    useEffect(() => {
        if (activeTab.startsWith('term-')) {
            initWebSocket(activeTab);
        }
    }, [activeTab]);

    const handleAddTerminal = () => {
        const id = 'term-' + generateId();
        const num = terminals.length + 1;
        setTerminals(prev => [...prev, { id, name: `Terminal ${num}`, output: '', input: '', ws: null }]);
        setActiveTab(id);
    };

    const handleCloseTerminal = (e, id) => {
        e.stopPropagation();
        if (wsInstances.current[id]) {
            wsInstances.current[id].close();
            delete wsInstances.current[id];
        }
        setTerminals(prev => {
            const newTerms = prev.filter(t => t.id !== id);
            if (activeTab === id) {
                // Switch to previous term or fallback
                setActiveTab(newTerms.length > 0 ? newTerms[newTerms.length - 1].id : 'ai');
            }
            return newTerms;
        });
    };

    const handleStartRename = (id, currentName) => {
        setRenamingTerm(id);
        setRenameInput(currentName);
    };

    const handleConfirmRename = () => {
        if (renamingTerm && renameInput.trim()) {
            setTerminals(prev => prev.map(t => t.id === renamingTerm ? { ...t, name: renameInput.trim() } : t));
        }
        setRenamingTerm(null);
    };

    const handleRenameKeyDown = (e) => {
        if (e.key === 'Enter') handleConfirmRename();
        if (e.key === 'Escape') setRenamingTerm(null);
    };

    const handleTermSubmit = (id) => {
        const term = terminals.find(t => t.id === id);
        if (!term || !term.input.trim() || !wsInstances.current[id]) return;

        wsInstances.current[id].send(term.input + '\n');
        setTerminals(prev => prev.map(t => t.id === id ? { ...t, input: '' } : t));
    };

    const handleTermKeyDown = (e, id) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleTermSubmit(id);
        }
    };

    // ─── Auto-Correction Logic ──────────────────────────────
    const handleSilentCorrection = (msg) => {
        if (streaming) return;
        setFileOps([]);
        setStreaming(true);
        setActiveTab('ai'); // Focus back to Agent

        const sep = output ? '\n\n' : '';
        // Give a clear UI indication that the agent is self-healing
        const header = `${sep}▶ [Auto-Correction Triggered]\nLumina detected a terminal error and is fixing it...\n\n◀ Lumina:\n`;
        const baseOutput = output + header;
        setOutput(baseOutput);

        let accumulated = '';
        cancelRef.current?.();

        let enrichedPrompt = '';
        if (promptFiles.length > 0) {
            enrichedPrompt += '═══ CUSTOM INSTRUCTIONS ═══\n';
            promptFiles.forEach(pf => { enrichedPrompt += `--- ${pf.name} ---\n${pf.content}\n\n`; });
        }
        enrichedPrompt += msg;

        const cancel = streamGenerate(
            { prompt: enrichedPrompt, mode },
            {
                onToken: (token) => {
                    accumulated += token;
                    setOutput(baseOutput + accumulated);
                },
                onFiles: (files) => {
                    setFileOps(files);
                    onFilesCreated?.(files);
                    const summary = files.map(f => {
                        let icon = f.status === 'created' ? '✅' : f.status === 'deleted' ? '🗑️' : f.status === 'error' ? '❌' : '📝';
                        if (f.path.includes('Template')) icon = '📦';
                        if (f.path.startsWith('>')) icon = '⚙️';
                        return `  ${icon} ${f.path.replace('> ', '')} (${f.status})`;
                    }).join('\n');
                    accumulated += '\n\n───── Auto-Correction Applied ─────\n' + summary + '\n';
                    setOutput(baseOutput + accumulated);
                },
                onPendingConfirmation: (id, blocks) => {
                    setPendingConfirmation({ id, blocks });
                    let summary = blocks.map(b => `  ⏳ ${b.file}`).join('\n');
                    accumulated += '\n\n───── Aguardando Aprovação (Modo Manual) ─────\n' + summary + '\n';
                    setOutput(baseOutput + accumulated);
                },
                onDone: () => setStreaming(false),
                onError: (err) => { setError(err.message); setStreaming(false); },
            }
        );
        cancelRef.current = cancel;
    };

    useEffect(() => {
        if (streaming) return;

        // Monitor only the active terminal for immediate feedback
        const activeTerm = terminals.find(t => t.id === activeTab);
        if (!activeTerm || !activeTerm.output) return;

        // Strip ANSI codes
        const plainText = activeTerm.output.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');

        // Look at the last 2000 chars to avoid re-triggering on old scrolled errors
        const recentTokens = plainText.slice(-2000);

        // Regex for common build/runtime errors
        const errorMatch = recentTokens.match(/(?:ERR!|Error:|Failed to compile)([\s\S]{10,350})/);

        if (errorMatch) {
            const errorSnippet = errorMatch[0].trim();
            // Ignore if we already processed this exact snippet recently
            if (errorSnippet !== lastProcessedError && errorSnippet.length > 15) {
                setLastProcessedError(errorSnippet);
                const msg = `O seu último comando gerou o seguinte erro no terminal:\n\n\`\`\`\n${errorSnippet}\n\`\`\`\n\nPor favor, analise as mensagens de erro, corrija o código imediatamente usando os blocos 📄 FILE: (ou comandos ⚙️ COMMAND: se precisar) e me diga o que você corrigiu.`;
                handleSilentCorrection(msg);
            }
        }
    }, [terminals, activeTab, streaming, lastProcessedError, promptFiles, mode, output]);

    // ─── AI Logic ───────────────────────────────────────────
    const handleAISubmit = () => {
        if (!prompt.trim() || streaming) return;
        const currentPrompt = prompt;
        setPrompt('');
        setError(null);
        setFileOps([]);
        setStreaming(true);
        setActiveTab('ai');

        const sep = output ? '\n\n' : '';
        const header = `${sep}▶ Você:\n${currentPrompt}\n\n◀ Lumina:\n`;
        const baseOutput = output + header;
        setOutput(baseOutput);

        // ─── Build enriched prompt with context ─────────
        let enrichedPrompt = '';

        // Prepend custom instructional prompts
        if (promptFiles.length > 0) {
            enrichedPrompt += '═══ CUSTOM INSTRUCTIONS ═══\n';
            promptFiles.forEach(pf => {
                enrichedPrompt += `--- ${pf.name} ---\n${pf.content}\n\n`;
            });
        }

        enrichedPrompt += currentPrompt;

        let accumulated = '';
        cancelRef.current?.();

        const cancel = streamGenerate(
            { prompt: enrichedPrompt, mode },
            {
                onToken: (token) => {
                    accumulated += token;
                    setOutput(baseOutput + accumulated);
                },
                onFiles: async (files) => {
                    setFileOps(files);
                    onFilesCreated?.(files);

                    let interceptPrompt = '';

                    for (const f of files) {
                        if (f.path.startsWith('Search: ')) {
                            const query = f.path.replace('Search: ', '').trim();
                            try {
                                const tree = await getFileTree();
                                interceptPrompt += `\n[Search Results for '${query}']: \n` + JSON.stringify(tree, null, 2).slice(0, 1500) + '\n';
                            } catch (e) {
                                interceptPrompt += `\n[Search Error]: ${e.message}\n`;
                            }
                        } else if (f.path.startsWith('Read: ')) {
                            const readPath = f.path.replace('Read: ', '').trim();
                            try {
                                const data = await readFile(readPath);
                                interceptPrompt += `\n[File Content for '${readPath}']: \n${data.content || 'Binary/Empty'}\n`;
                            } catch (e) {
                                interceptPrompt += `\n[Read Error for '${readPath}']: ${e.message}\n`;
                            }
                        }
                    }

                    const summary = files.map(f => {
                        let icon = f.status === 'created' ? '✅' : f.status === 'deleted' ? '🗑️' : f.status === 'error' ? '❌' : '📝';
                        if (f.path.includes('Template')) icon = '📦';
                        if (f.path.startsWith('>')) icon = '⚙️';
                        if (f.path.startsWith('Search: ')) icon = '🔍';
                        if (f.path.startsWith('Read: ')) icon = '📖';
                        return `  ${icon} ${f.path.replace('> ', '').replace('Search: ', '').replace('Read: ', '')} (${f.status})`;
                    }).join('\n');
                    accumulated += '\n\n───── Arquivos & Comandos ─────\n' + summary + '\n';
                    setOutput(baseOutput + accumulated);

                    if (interceptPrompt) {
                        const nextMsg = `Você executou comandos de descoberta de arquivos. Aqui estão os resultados do sistema:\n${interceptPrompt}\nAGORA CONTINUE SUA TAREFA BASEADO NESTES DADOS:`;
                        setTimeout(() => handleSilentCorrection(nextMsg), 500);
                    }
                },
                onPendingConfirmation: (id, blocks) => {
                    setPendingConfirmation({ id, blocks });
                    let summary = blocks.map(b => `  ⏳ ${b.file}`).join('\n');
                    accumulated += '\n\n───── Aguardando Aprovação (Modo Manual) ─────\n' + summary + '\n';
                    setOutput(baseOutput + accumulated);
                },
                onDone: () => setStreaming(false),
                onError: (err) => { setError(err.message); setStreaming(false); },
            }
        );
        cancelRef.current = cancel;
    };

    const handleAIKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAISubmit(); }
    };

    const activeTermObj = terminals.find(t => t.id === activeTab);

    // Toggle Port configuration UI
    const togglePortConfig = () => {
        setConfiguringPort(!configuringPort);
    };

    return (
        <div className="bottom-panel">
            {/* Panel tabs */}
            <div className="bottom-tabs">
                <button
                    className={`bottom-tab ${activeTab === 'ai' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ai')}
                >
                    🤖 Agent
                    {streaming && <span className="streaming-dot" />}
                </button>
                <button
                    className={`bottom-tab ${activeTab === 'output' ? 'active' : ''}`}
                    onClick={() => setActiveTab('output')}
                >
                    📋 Output
                </button>

                {/* Dynamically render terminal tabs */}
                <div style={{ display: 'flex', borderLeft: '1px solid var(--border)', marginLeft: '4px', paddingLeft: '4px' }}>
                    {terminals.map(term => (
                        <div
                            key={term.id}
                            className={`bottom-tab ${activeTab === term.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(term.id)}
                            onDoubleClick={() => handleStartRename(term.id, term.name)}
                            title="Dê dois cliques para renomear"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            {renamingTerm === term.id ? (
                                <input
                                    autoFocus
                                    value={renameInput}
                                    onChange={(e) => setRenameInput(e.target.value)}
                                    onBlur={handleConfirmRename}
                                    onKeyDown={handleRenameKeyDown}
                                    style={{
                                        background: 'transparent', border: '1px solid var(--accent)',
                                        color: 'var(--text)', outline: 'none', width: '80px',
                                        fontSize: '11px', padding: '2px 4px'
                                    }}
                                />
                            ) : (
                                <>$_ {term.name}</>
                            )}
                            <span
                                className="tab-close-icon"
                                onClick={(e) => handleCloseTerminal(e, term.id)}
                            >
                                x
                            </span>
                        </div>
                    ))}
                    <button className="bottom-action tab-add-btn" onClick={handleAddTerminal} title="Novo Terminal">
                        +
                    </button>
                </div>

                <div className="bottom-tabs-actions">
                    {activeTab === 'ai' && output && (
                        <button className="bottom-action" onClick={() => { setOutput(''); setFileOps([]); }} title="Limpar">
                            🗑️
                        </button>
                    )}
                    {activeTab === 'ai' && streaming && (
                        <button className="bottom-action stop" onClick={() => { cancelRef.current?.(); setStreaming(false); }}>
                            ■ Parar
                        </button>
                    )}
                    {activeTab.startsWith('term-') && (
                        <>
                            <button className="bottom-action" onClick={togglePortConfig} title="Configurar Porta">
                                🔌 {activeTermObj?.port ? `Porta: ${activeTermObj.port}` : 'Porta'}
                            </button>
                            <button className="bottom-action" onClick={() => setTerminals(prev => prev.map(t => t.id === activeTab ? { ...t, output: '' } : t))} title="Limpar Terminal">
                                🗑️
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* AI Port Config Toolbar for Active Terminal */}
            {configuringPort && activeTab.startsWith('term-') && activeTermObj && (
                <div style={{ padding: '8px 14px', background: 'var(--bg-overlay)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Configuração de Porta para {activeTermObj.name}:</span>
                    <input
                        className="settings-input"
                        style={{ width: '120px', padding: '4px 8px', fontSize: '11px', height: '24px' }}
                        placeholder="Ex: 8080"
                        value={activeTermObj.port}
                        onChange={(e) => setTerminals(prev => prev.map(t => t.id === activeTermObj.id ? { ...t, port: e.target.value } : t))}
                    />
                    <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={togglePortConfig}>Salvar</button>
                </div>
            )}

            {/* Output area for AI */}
            {activeTab === 'ai' && (
                <div ref={outputRef} className={`bottom-output ${streaming ? 'streaming' : ''}`}>
                    <PlanStepper />
                    {output ? (
                        <>
                            {output}
                            {streaming && <span className="cursor-blink" />}
                        </>
                    ) : (
                        <div className="bottom-welcome">
                            <span>🛰️ Lumina Agent — Digite um prompt abaixo. Abra uma pasta no Explorer para criar arquivos.</span>
                        </div>
                    )}
                </div>
            )}

            {/* Output areas for Terminals */}
            {terminals.map(term => (
                <div
                    key={term.id}
                    className="bottom-output terminal"
                    ref={el => terminalOutputRefs.current[term.id] = el}
                    style={{ display: activeTab === term.id ? 'block' : 'none', overflowY: 'auto' }}
                >
                    <pre className="terminal-content">{term.output}</pre>
                </div>
            ))}

            {activeTab === 'output' && (
                <div className="bottom-output" style={{ color: 'var(--text-muted)', padding: '16px' }}>
                    Esta aba exibe os logs e console de debugging do sistema.
                </div>
            )}

            {/* AI File ops */}
            {activeTab === 'ai' && fileOps.length > 0 && (
                <div className="file-ops-inline">
                    {fileOps.map((f, i) => (
                        <span key={i} className={`file-op-chip ${f.status}`}>
                            {f.status === 'created' ? '✅' : '📝'} {f.path}
                        </span>
                    ))}
                </div>
            )}

            {/* AI Error */}
            {activeTab === 'ai' && error && (
                <div className="bottom-error">
                    ⚠️ {error}
                    <button onClick={() => setError(null)}>✕</button>
                </div>
            )}

            {/* Pending Confirmation UI */}
            {activeTab === 'ai' && pendingConfirmation && (
                <div style={{ padding: '8px 12px', background: 'var(--bg-overlay)', borderTop: '1px solid var(--accent-red)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text)' }}>
                            <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>⚠️ Mudanças Pendentes:</span> O Agente quer modificar {pendingConfirmation.blocks.length} arquivo(s).
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-secondary" onClick={() => setViewingDiff(!viewingDiff)}>
                                {viewingDiff ? 'Ocultar Diff' : 'Visualizar Diff'}
                            </button>
                            <button className="btn-secondary" onClick={() => { setPendingConfirmation(null); setViewingDiff(false); }}>Recusar</button>
                            <button className="btn-primary" onClick={async () => {
                                import('../services/api').then(m => {
                                    m.confirmChanges(pendingConfirmation.id).then(res => {
                                        setFileOps(res.files);
                                        onFilesCreated?.(res.files);
                                        setPendingConfirmation(null);
                                        setViewingDiff(false);
                                        setOutput(prev => prev + '\n\n✅ Mudanças Aprovadas e Aplicadas!\n');
                                    }).catch(err => setError(err.message));
                                });
                            }}>Aprovar Mudanças</button>
                        </div>
                    </div>
                    {viewingDiff && (
                        <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto', background: 'var(--bg-element)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                            {pendingConfirmation.blocks.map((b, i) => (
                                <div key={i} style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '4px' }}>📄 {b.file}</div>
                                    <pre style={{ margin: 0, fontSize: '10px', whiteSpace: 'pre-wrap', color: 'var(--text-muted)' }}>
                                        {b.content.slice(0, 500)}
                                        {b.content.length > 500 && '\n... [conteúdo truncado para visualização] ...'}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Prompt bar / Terminal Input */}
            <div className="bottom-prompt">
                {activeTab === 'ai' ? (
                    <>
                        <div className="bottom-prompt-input-row" style={{ position: 'relative' }}>
                            <div className="prompt-mode" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="prompt-dot" />
                                {mode === 'local' ? 'Ollama' : 'Cloud'}
                                {activeModelData && activeModelData.details && (
                                    <span style={{
                                        fontSize: '9px',
                                        padding: '2px 6px',
                                        borderRadius: '10px',
                                        background: parseFloat(activeModelData.details.parameter_size || 0) >= 30 ? 'var(--accent)' : parseFloat(activeModelData.details.parameter_size || 0) >= 8 ? 'var(--accent-green)' : 'var(--border)',
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        letterSpacing: '0.5px'
                                    }} title={`Parâmetros: ${activeModelData.details.parameter_size || 'N/A'}`}>
                                        {parseFloat(activeModelData.details.parameter_size || 0) >= 30 ? 'ELITE' : parseFloat(activeModelData.details.parameter_size || 0) >= 8 ? 'PRO' : 'ECO'}
                                    </span>
                                )}
                            </div>
                            <textarea
                                ref={promptRef}
                                className="prompt-textarea"
                                placeholder="Peça ao Lumina IDE... (Enter envia, Shift+Enter nova linha)"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={handleAIKeyDown}
                                rows={1}
                                onInput={(e) => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                                }}
                            />
                            <button
                                className={`prompt-send ${streaming ? 'stop' : ''}`}
                                onClick={streaming ? () => { cancelRef.current?.(); setStreaming(false); } : handleAISubmit}
                                disabled={!streaming && !prompt.trim()}
                            >
                                {streaming ? '■' : '↑'}
                            </button>
                        </div>
                    </>
                ) : activeTermObj ? (
                    <>
                        <div className="prompt-mode" style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => handleStartRename(activeTermObj.id, activeTermObj.name)} title="Clique para renomear">
                            <span className="prompt-dot" style={{ background: 'var(--accent)' }} />
                            {activeTermObj.name}
                        </div>
                        <input
                            className="prompt-textarea terminal-input"
                            placeholder={`Comando no ${activeTermObj.name} (ex: npm run dev) ...`}
                            value={activeTermObj.input}
                            onChange={(e) => setTerminals(prev => prev.map(t => t.id === activeTermObj.id ? { ...t, input: e.target.value } : t))}
                            onKeyDown={(e) => handleTermKeyDown(e, activeTermObj.id)}
                            style={{ height: '36px', overflow: 'hidden' }}
                        />
                        <button
                            className="prompt-send"
                            onClick={() => handleTermSubmit(activeTermObj.id)}
                            disabled={!activeTermObj.input.trim()}
                        >
                            ↵
                        </button>
                    </>
                ) : (
                    <div style={{ padding: '8px', color: 'var(--text-muted)' }}>Output tab selecionada.</div>
                )}
            </div>
        </div>
    );
}

```

## src\components\ExtensionPanel.jsx

```jsx
import React, { useState, useEffect } from 'react';
import { fetchExtensions, fetchExtensionsPath, toggleExtension } from '../services/api';

export default function ExtensionPanel() {
    const [extensions, setExtensions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [extPath, setExtPath] = useState('');

    const loadExtensions = async () => {
        setLoading(true);
        try {
            const [data, pathData] = await Promise.all([
                fetchExtensions(),
                fetchExtensionsPath(),
            ]);
            setExtensions(data.extensions || []);
            setExtPath(pathData.path || '');
            setError(null);
        } catch (err) {
            setError(err.message || 'Erro ao carregar extensões');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadExtensions();
    }, []);

    const handleToggle = async (id, currentState) => {
        try {
            // Optimistic update
            setExtensions(prev => prev.map(ext =>
                ext.id === id ? { ...ext, enabled: !currentState } : ext
            ));

            const result = await toggleExtension(id);

            // Revert if API state doesn't match
            if (result.enabled === currentState) {
                setExtensions(prev => prev.map(ext =>
                    ext.id === id ? { ...ext, enabled: currentState } : ext
                ));
            }
        } catch (err) {
            alert('Falha ao alterar extensão: ' + err.message);
            // Revert optimistic update
            setExtensions(prev => prev.map(ext =>
                ext.id === id ? { ...ext, enabled: currentState } : ext
            ));
        }
    };

    return (
        <div className="panel-placeholder">
            <div className="panel-header">EXTENSÕES</div>

            <div className="extensions-menu">
                <p className="panel-hint" style={{ padding: '0 12px 12px' }}>
                    🧩 Adicione funcionalidades à Lumina IDE via extensões locais.
                </p>

                {loading ? (
                    <div className="extensions-loading">⏳ Carregando...</div>
                ) : error ? (
                    <div className="extensions-error">❌ {error}</div>
                ) : extensions.length === 0 ? (
                    <div className="extensions-empty">
                        <p>Nenhuma extensão instalada.</p>
                        <span className="panel-hint" style={{ display: 'block', marginTop: '8px', fontSize: '10px' }}>
                            Coloque pastas com <code style={{ background: 'var(--bg-overlay)', padding: '2px 4px', borderRadius: '3px' }}>extension.json</code> em <br />
                            <code style={{ color: 'var(--accent)', wordBreak: 'break-all' }}>{extPath || '...'}</code>
                        </span>
                    </div>
                ) : (
                    <div className="extensions-list">
                        {extensions.map(ext => (
                            <div key={ext.id} className={`extension-card ${ext.enabled ? '' : 'disabled'}`}>
                                <div className="extension-header">
                                    <h3 className="extension-name">{ext.name}</h3>
                                    <span className="extension-version">v{ext.version}</span>
                                </div>

                                <p className="extension-desc">{ext.description}</p>

                                <div className="extension-footer">
                                    <span className="extension-author">Por: {ext.author}</span>

                                    <button
                                        className={`btn-ghost ${ext.enabled ? 'active' : ''}`}
                                        onClick={() => handleToggle(ext.id, ext.enabled)}
                                        style={{
                                            color: ext.enabled ? 'var(--accent-red)' : 'var(--accent-green)',
                                            borderColor: ext.enabled ? 'rgba(243,139,168,0.3)' : 'rgba(166,227,161,0.3)',
                                            padding: '2px 8px', fontSize: '10px'
                                        }}
                                    >
                                        {ext.enabled ? 'Desabilitar' : 'Habilitar'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

```

## src\components\FileEditor.jsx

```jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { writeFile, fetchAutocomplete } from '../services/api';

export default function FileEditor({ file, onClose, onSaved }) {
    const [content, setContent] = useState(file.content);
    const [modified, setModified] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');
    const [autocomplete, setAutocomplete] = useState(true);
    const [lumenLines, setLumenLines] = useState(new Set());
    const [ghostText, setGhostText] = useState('');
    const [ghostPos, setGhostPos] = useState({ line: 0, col: 0 });
    const [loadingGhost, setLoadingGhost] = useState(false);

    // Find-in-file state
    const [findOpen, setFindOpen] = useState(false);
    const [findQuery, setFindQuery] = useState('');
    const [matches, setMatches] = useState([]);
    const [currentMatch, setCurrentMatch] = useState(0);

    const textareaRef = useRef(null);
    const lineNumRef = useRef(null);
    const findInputRef = useRef(null);
    const autocompleteTimer = useRef(null);
    const abortRef = useRef(null);

    // Sync content when file changes
    useEffect(() => {
        setContent(file.content);
        setModified(false);
        setSaveStatus('');
        setLumenLines(new Set());
        setGhostText('');
        setFindOpen(false);
        setFindQuery('');
    }, [file.path]);

    // Sync scroll between line numbers and textarea
    const handleScroll = () => {
        if (lineNumRef.current && textareaRef.current) {
            lineNumRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    // ─── Autocomplete Logic ─────────────────────────────────────────
    const requestAutocomplete = useCallback(async () => {
        if (!autocomplete || !textareaRef.current) return;

        const ta = textareaRef.current;
        const cursorPos = ta.selectionStart;
        const lines = content.substring(0, cursorPos).split('\n');
        const cursorLine = lines.length - 1;
        const cursorCol = lines[lines.length - 1].length;

        // Don't autocomplete on empty lines or very short context
        if (cursorCol < 2 && cursorLine < 2) return;

        const fileName = file.path.split(/[\\/]/).pop();

        setLoadingGhost(true);
        try {
            const suggestion = await fetchAutocomplete({
                code: content,
                cursorLine,
                cursorCol,
                filename: fileName,
                mode: 'local',
            });
            if (suggestion && suggestion.trim()) {
                setGhostText(suggestion);
                setGhostPos({ line: cursorLine, col: cursorCol });
            } else {
                setGhostText('');
            }
        } catch {
            setGhostText('');
        } finally {
            setLoadingGhost(false);
        }
    }, [content, autocomplete, file.path]);

    const handleChange = (e) => {
        const newContent = e.target.value;
        setContent(newContent);
        if (!modified) setModified(true);
        setGhostText(''); // Clear ghost on any change

        // Debounce autocomplete request
        if (autocompleteTimer.current) clearTimeout(autocompleteTimer.current);
        if (autocomplete) {
            autocompleteTimer.current = setTimeout(() => {
                requestAutocomplete();
            }, 800);
        }
    };

    const acceptGhost = () => {
        if (!ghostText || !textareaRef.current) return false;

        const ta = textareaRef.current;
        const cursorPos = ta.selectionStart;
        const newContent = content.substring(0, cursorPos) + ghostText + content.substring(cursorPos);
        setContent(newContent);
        setModified(true);
        setGhostText('');

        // Move cursor to end of inserted text
        requestAnimationFrame(() => {
            const newPos = cursorPos + ghostText.length;
            ta.selectionStart = ta.selectionEnd = newPos;
        });

        return true;
    };

    const handleSave = useCallback(async () => {
        setSaveStatus('saving');
        try {
            await writeFile(file.path, content);
            setModified(false);
            setSaveStatus('saved');
            onSaved?.();
            setTimeout(() => setSaveStatus(''), 2000);
        } catch {
            setSaveStatus('error');
        }
    }, [content, file.path, onSaved]);

    // ─── Find-in-File Logic ─────────────────────────────────────────
    useEffect(() => {
        if (!findQuery || !findOpen) {
            setMatches([]);
            setCurrentMatch(0);
            return;
        }
        const q = findQuery.toLowerCase();
        const found = [];
        const lines = content.split('\n');
        lines.forEach((line, lineIdx) => {
            let col = 0;
            const lower = line.toLowerCase();
            while (col < lower.length) {
                const idx = lower.indexOf(q, col);
                if (idx === -1) break;
                found.push({ line: lineIdx, col: idx, length: q.length });
                col = idx + 1;
            }
        });
        setMatches(found);
        setCurrentMatch(found.length > 0 ? 0 : -1);
    }, [findQuery, content, findOpen]);

    const goToMatch = useCallback((index) => {
        if (matches.length === 0 || !textareaRef.current) return;
        const m = matches[index];
        if (!m) return;
        const lines = content.split('\n');
        let pos = 0;
        for (let i = 0; i < m.line; i++) pos += lines[i].length + 1;
        pos += m.col;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos, pos + m.length);
        setCurrentMatch(index);
    }, [matches, content]);

    const findNext = useCallback(() => {
        if (matches.length === 0) return;
        const next = (currentMatch + 1) % matches.length;
        goToMatch(next);
    }, [currentMatch, matches, goToMatch]);

    const findPrev = useCallback(() => {
        if (matches.length === 0) return;
        const prev = (currentMatch - 1 + matches.length) % matches.length;
        goToMatch(prev);
    }, [currentMatch, matches, goToMatch]);

    // ─── Keyboard Shortcuts ─────────────────────────────────────────
    const handleKeyDown = (e) => {
        // Ctrl+S save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            handleSave();
            return;
        }
        // Ctrl+F find
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            setFindOpen(true);
            setTimeout(() => findInputRef.current?.focus(), 50);
            return;
        }
        // Escape close find
        if (e.key === 'Escape' && findOpen) {
            setFindOpen(false);
            setFindQuery('');
            textareaRef.current?.focus();
            return;
        }
        // Tab — accept ghost or indent
        if (e.key === 'Tab') {
            if (ghostText) {
                e.preventDefault();
                acceptGhost();
                return;
            }
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const newContent = content.substring(0, start) + '    ' + content.substring(end);
            setContent(newContent);
            setModified(true);
            requestAnimationFrame(() => {
                e.target.selectionStart = e.target.selectionEnd = start + 4;
            });
        }
    };

    // Global Ctrl+F handler
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                setFindOpen(true);
                setTimeout(() => findInputRef.current?.focus(), 50);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const lines = content.split('\n');
    const lineCount = lines.length;
    const fileName = file.path.split(/[\\/]/).pop();
    const ext = '.' + fileName.split('.').pop();

    const langMap = {
        '.py': 'Python', '.js': 'JavaScript', '.jsx': 'JSX', '.ts': 'TypeScript',
        '.tsx': 'TSX', '.html': 'HTML', '.css': 'CSS', '.json': 'JSON',
        '.md': 'Markdown', '.sql': 'SQL', '.yaml': 'YAML', '.yml': 'YAML',
    };

    return (
        <div className="file-editor">
            <div className="editor-toolbar">
                <div className="editor-toolbar-left">
                    <span className="editor-filename">{fileName}</span>
                    {modified && <span className="editor-modified-dot">●</span>}
                    <span className="editor-lang">{langMap[ext] || ext}</span>
                </div>
                <div className="editor-toolbar-right">
                    {/* Autocomplete toggle */}
                    <button
                        className={`autocomplete-toggle ${autocomplete ? 'on' : 'off'}`}
                        onClick={() => setAutocomplete(!autocomplete)}
                        title={autocomplete ? 'Autocomplete ON' : 'Autocomplete OFF'}
                    >
                        <span className="toggle-icon">🧠</span>
                        <span className="toggle-label">Agent</span>
                        <span className={`toggle-switch ${autocomplete ? 'on' : ''}`} />
                    </button>

                    {/* Ghost loading indicator */}
                    {loadingGhost && <span className="ghost-loading">⏳</span>}

                    {saveStatus && (
                        <span className={`save-indicator ${saveStatus}`}>
                            {saveStatus === 'saving' ? '💾 Salvando...' :
                                saveStatus === 'saved' ? '✅ Salvo' :
                                    '❌ Erro'}
                        </span>
                    )}

                    <span className="editor-info">{lineCount} linhas</span>
                    <button className="editor-save-btn" onClick={handleSave} disabled={!modified}>
                        💾
                    </button>
                </div>
            </div>

            {/* ─── Find Bar ──────────────────────────────────────── */}
            {findOpen && (
                <div className="find-bar">
                    <div className="find-bar-inner">
                        <span className="find-icon">🔍</span>
                        <input
                            ref={findInputRef}
                            className="find-input"
                            value={findQuery}
                            onChange={(e) => setFindQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); findPrev(); }
                                else if (e.key === 'Enter') { e.preventDefault(); findNext(); }
                                else if (e.key === 'Escape') { setFindOpen(false); setFindQuery(''); textareaRef.current?.focus(); }
                            }}
                            placeholder="Buscar no arquivo..."
                            autoFocus
                        />
                        <span className="find-count">
                            {matches.length > 0
                                ? `${currentMatch + 1} / ${matches.length}`
                                : findQuery ? 'Sem resultados' : ''}
                        </span>
                        <button className="find-nav-btn" onClick={findPrev} disabled={matches.length === 0} title="Anterior (Shift+Enter)">▲</button>
                        <button className="find-nav-btn" onClick={findNext} disabled={matches.length === 0} title="Próximo (Enter)">▼</button>
                        <button className="find-close-btn" onClick={() => { setFindOpen(false); setFindQuery(''); textareaRef.current?.focus(); }}>✕</button>
                    </div>
                </div>
            )}

            <div className="code-area">
                <div className="line-numbers" ref={lineNumRef}>
                    {Array.from({ length: lineCount }, (_, i) => (
                        <div
                            key={i}
                            className={`line-num ${lumenLines.has(i) ? 'lumen-glow' : ''} ${matches.some(m => m.line === i) ? 'find-highlight-line' : ''}`}
                        >
                            {i + 1}
                        </div>
                    ))}
                </div>
                <div className="code-editor-wrapper">
                    <textarea
                        ref={textareaRef}
                        className="code-textarea"
                        value={content}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onScroll={handleScroll}
                        spellCheck={false}
                        wrap="off"
                    />
                    {/* Ghost text overlay */}
                    {ghostText && (
                        <div className="ghost-overlay" style={{
                            top: `${ghostPos.line * 20 + 8}px`,
                            left: `${ghostPos.col * 7.8 + 16}px`,
                        }}>
                            <span className="ghost-text">{ghostText}</span>
                            <span className="ghost-hint">Tab ↹</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

```

## src\components\FileExplorer.jsx

```jsx
import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { getWorkspace, openFolder, browseFolder, getFileTree, readFile } from '../services/api';

const FILE_ICONS = {
    '.py': '🐍', '.js': '🟨', '.jsx': '⚛️', '.ts': '🔷', '.tsx': '⚛️',
    '.html': '🌐', '.css': '🎨', '.json': '📋', '.md': '📝', '.txt': '📄',
    '.yaml': '⚙️', '.yml': '⚙️', '.env': '🔒', '.sql': '🗃️', '.sh': '🖥️',
    '.go': '🔵', '.rs': '🦀', '.java': '☕', '.c': '🔧', '.cpp': '🔧',
};

function TreeItem({ node, depth = 0, onFileClick, activeFile }) {
    const [expanded, setExpanded] = useState(depth < 1);

    if (node.type === 'dir') {
        return (
            <div className="tree-node">
                <div
                    className="tree-label dir"
                    style={{ paddingLeft: depth * 16 + 8 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(!expanded);
                    }}
                >
                    <span className="tree-arrow">{expanded ? '▾' : '▸'}</span>
                    <span className="tree-icon">{expanded ? '📂' : '📁'}</span>
                    <span className="tree-name">{node.name}</span>
                </div>
                {expanded && node.children && Array.isArray(node.children) && node.children.map((child) => (
                    <TreeItem
                        key={child.path}
                        node={child}
                        depth={depth + 1}
                        onFileClick={onFileClick}
                        activeFile={activeFile}
                    />
                ))}
            </div>
        );
    }

    const icon = FILE_ICONS[node.ext] || '📄';
    const isActive = activeFile === node.path;

    return (
        <div
            className={`tree-label file ${isActive ? 'active' : ''}`}
            style={{ paddingLeft: depth * 16 + 8 }}
            onClick={(e) => {
                e.stopPropagation();
                if (node.is_text !== false) {
                    onFileClick(node.path);
                }
            }}
            title={node.path}
        >
            <span className="tree-icon">{icon}</span>
            <span className="tree-name">{node.name}</span>
        </div>
    );
}

const FileExplorer = forwardRef(function FileExplorer({ onFileSelect, activeFile }, ref) {
    const [workspace, setWorkspace] = useState(null);
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(false);
    const [folderInput, setFolderInput] = useState('');
    const [showInput, setShowInput] = useState(false);

    // Expose refresh() for parent to call
    useImperativeHandle(ref, () => ({
        refresh: () => loadTree(),
        getWorkspacePath: () => workspace,
    }));

    // Load workspace on mount
    useEffect(() => {
        getWorkspace()
            .then((data) => {
                if (data.is_open) {
                    setWorkspace(data.path);
                    loadTree();
                }
            })
            .catch(() => { });
    }, []);

    // Auto-poll every 5 seconds when window is focused
    useEffect(() => {
        if (!workspace) return;
        let interval;

        const startPolling = () => {
            interval = setInterval(() => {
                if (document.hasFocus()) loadTree(true);
            }, 5000);
        };

        startPolling();
        return () => clearInterval(interval);
    }, [workspace]);

    const loadTree = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await getFileTree();
            setTree(data.tree || []);
            setWorkspace(data.path);
        } catch {
            if (!silent) setTree([]);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    const handleOpen = async () => {
        if (!folderInput.trim()) return;
        try {
            const result = await openFolder(folderInput.trim());
            if (result.status === 'opened') {
                setWorkspace(result.path);
                setShowInput(false);
                setFolderInput('');
                loadTree();
            }
        } catch (err) {
            alert('Erro ao abrir pasta: ' + (err.message || err));
        }
    };

    const handleBrowse = async () => {
        setLoading(true);
        try {
            const result = await browseFolder();
            if (result.status === 'opened') {
                setWorkspace(result.path);
                setShowInput(false);
                loadTree();
            }
        } catch {
            // cancelled
        } finally {
            setLoading(false);
        }
    };

    const handleFileClick = async (filePath) => {
        try {
            const data = await readFile(filePath);
            if (data.content !== null) {
                onFileSelect?.({
                    path: data.path,
                    content: data.content,
                    ext: data.ext,
                    lines: data.lines,
                    size: data.size,
                });
            }
        } catch {
            // handle
        }
    };

    return (
        <div className="file-explorer">
            <div className="explorer-header">
                <span className="explorer-title">EXPLORER</span>
                <div className="explorer-actions">
                    <button className="explorer-action" onClick={handleBrowse} title="Abrir pasta">📂</button>
                    <button className="explorer-action" onClick={() => setShowInput(!showInput)} title="Digitar caminho">✏️</button>
                    {workspace && <button className="explorer-action" onClick={() => loadTree()} title="Atualizar">🔄</button>}
                </div>
            </div>

            {showInput && (
                <div className="explorer-input-row">
                    <input
                        value={folderInput}
                        onChange={(e) => setFolderInput(e.target.value)}
                        placeholder="C:\caminho\da\pasta"
                        onKeyDown={(e) => e.key === 'Enter' && handleOpen()}
                        autoFocus
                    />
                    <button onClick={handleOpen}>OK</button>
                </div>
            )}

            {workspace && (
                <div className="explorer-workspace" title={workspace}>
                    📁 {workspace.split(/[\\/]/).pop()}
                </div>
            )}

            <div className="explorer-tree">
                {loading ? (
                    <div className="explorer-loading">⏳ Carregando...</div>
                ) : tree.length > 0 ? (
                    tree.map((node) => (
                        <TreeItem
                            key={node.path}
                            node={node}
                            onFileClick={handleFileClick}
                            activeFile={activeFile}
                        />
                    ))
                ) : workspace ? (
                    <div className="explorer-empty">Pasta vazia</div>
                ) : (
                    <div className="explorer-empty-state">
                        <div className="empty-icon">📁</div>
                        <p>Nenhuma pasta aberta</p>
                        <button className="btn-primary" onClick={handleBrowse}>Abrir Pasta</button>
                        <button className="btn-ghost" onClick={() => setShowInput(true)}>Digitar Caminho</button>
                    </div>
                )}
            </div>
        </div>
    );
});

export default FileExplorer;

```

## src\components\OnboardingModal.jsx

```jsx
import React, { useState, useEffect } from 'react';
import { fetchSetupStatus, triggerInstall, streamPullModel } from '../services/api';

export default function OnboardingModal({ onComplete }) {
    const [needsOnboarding, setNeedsOnboarding] = useState(false);
    const [step, setStep] = useState('checking'); // checking, install, pick-model, pulling, done
    const [statusText, setStatusText] = useState('Verificando ambiente...');

    useEffect(() => {
        fetchSetupStatus()
            .then(data => {
                if (data.needs_onboarding) {
                    setNeedsOnboarding(true);
                    setStep('install');
                } else {
                    onComplete(); // Already installed
                }
            })
            .catch(() => {
                // If backend is down, maybe hide and let App retry health checks
            });
    }, [onComplete]);

    const handleInstall = async () => {
        setStep('installing');
        try {
            await triggerInstall();
            setStatusText('Ollama Download & Instalação Silenciosa iniciada. Aguarde...');
            // In a real app we'd poll status or just give it 30 seconds
            setTimeout(() => {
                setStep('pick-model');
            }, 5000);
        } catch (e) {
            setStatusText('Falha ao instalar Ollama.');
        }
    };

    const handlePull = (modelName) => {
        setStep('pulling');
        setStatusText(`Baixando ${modelName}... Isso pode demorar.`);

        streamPullModel({ model: modelName }, {
            onToken: (status) => setStatusText(status),
            onDone: () => {
                setStep('done');
                setTimeout(() => {
                    setNeedsOnboarding(false);
                    onComplete();
                }, 1500);
            },
            onError: (err) => setStatusText(`Erro: ${err.message}`)
        });
    };

    if (!needsOnboarding) return null;

    return (
        <div style={modalOverlayStyle}>
            <div style={modalStyle}>
                <h2 style={{ marginBottom: '10px' }}>🚀 Bem-vindo ao Lumina IDE</h2>

                {step === 'install' && (
                    <>
                        <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
                            Ollama não encontrado no seu sistema. O Lumina IDE precisa dele para rodar modelos locais com privacidade e performance.
                        </p>
                        <button className="settings-save-btn" onClick={handleInstall}>
                            Baixar e Instalar Ollama Silenciosamente
                        </button>
                    </>
                )}

                {step === 'installing' && (
                    <div style={{ textAlign: 'center', margin: '20px 0' }}>
                        <div className="loader"></div>
                        <p style={{ marginTop: '10px', color: 'var(--accent)' }}>{statusText}</p>
                    </div>
                )}

                {step === 'pick-model' && (
                    <>
                        <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
                            Ollama instalado! Agora precisamos do motor de inteligência (Modelo LLM). Escolha um para começar o download:
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button className="settings-theme-btn" onClick={() => handlePull('mistral')}>
                                Instrucional Rápido (Mistral 7B)
                            </button>
                            <button className="settings-theme-btn" onClick={() => handlePull('llama3:8b')}>
                                Geral Avançado (Llama 3 8B)
                            </button>
                        </div>
                    </>
                )}

                {step === 'pulling' && (
                    <div style={{ textAlign: 'center', margin: '20px 0' }}>
                        <div className="loader"></div>
                        <p style={{ marginTop: '10px', color: 'var(--accent)', fontSize: '12px' }}>{statusText}</p>
                    </div>
                )}

                {step === 'done' && (
                    <div style={{ textAlign: 'center', margin: '20px 0', color: 'var(--accent-green)' }}>
                        <h3 style={{ marginBottom: '10px' }}>Tudo Pronto!</h3>
                        <p>Iniciando o Lumina IDE...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const modalOverlayStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(5px)'
};

const modalStyle = {
    backgroundColor: 'var(--bg-editor)',
    padding: '30px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    width: '450px',
    maxWidth: '90%',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
    color: 'var(--text)'
};

```

## src\components\PlanStepper.jsx

```jsx
import React, { useState, useEffect } from 'react';
import { readFile } from '../services/api';

export default function PlanStepper() {
    const [planLines, setPlanLines] = useState([]);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        let isStale = false;

        const fetchPlan = async () => {
            try {
                const data = await readFile('LUMINA_PLAN.md');
                if (!isStale && data && data.content) {
                    const lines = data.content.split('\n').filter(l => l.trim().startsWith('- ['));
                    setPlanLines(lines);
                } else if (!isStale) {
                    setPlanLines([]);
                }
            } catch (err) {
                if (!isStale) setPlanLines([]);
            }
        };

        fetchPlan();
        const interval = setInterval(fetchPlan, 3000);
        return () => {
            isStale = true;
            clearInterval(interval);
        };
    }, []);

    if (planLines.length === 0) return null;

    // Parse tasks
    const tasks = planLines.map(line => {
        const isDone = line.includes('[x]') || line.includes('[X]');
        const isInProgress = line.includes('[/]');
        const text = line.replace(/^- \[[xX/ ]\]\s*/, '').trim();
        return { isDone, isInProgress, text };
    });

    return (
        <div className="plan-stepper" style={{
            margin: '8px 16px',
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            overflow: 'hidden'
        }}>
            <div
                style={{
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: 'var(--bg-element)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }}
                onClick={() => setCollapsed(!collapsed)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📝</span>
                    <span>Plano de Execução (LUMINA_PLAN.md)</span>
                </div>
                <span>{collapsed ? '▼' : '▲'}</span>
            </div>

            {!collapsed && (
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {tasks.map((t, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: t.isDone ? 0.6 : 1,
                            fontSize: '12px'
                        }}>
                            <div>
                                {t.isDone ? '✅' : t.isInProgress ? '🔄' : '⏳'}
                            </div>
                            <div style={{
                                textDecoration: t.isDone ? 'line-through' : 'none',
                                color: t.isInProgress ? 'var(--accent)' : 'inherit'
                            }}>
                                {t.text}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

```

## src\components\SettingsPanel.jsx

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { fetchConfig, updateConfig, fetchModels, fetchPermissions, updatePermissions } from '../services/api';

const PROVIDER_LABELS = {
    openai: '🟢 OpenAI',
    anthropic: '🟠 Anthropic',
    groq: '⚡ Groq',
    google: '🔵 Google AI',
    replicate: '🔮 Replicate',
    huggingface: '🤗 HuggingFace',
    xai: '✖️ xAI (Grok)',
    nvidia: '💚 NVIDIA NIM',
    custom: '🔧 Custom',
};

export default function SettingsPanel() {
    const [config, setConfig] = useState({
        ollama_host: '127.0.0.1',
        ollama_port: 11434,
        local_model: 'mistral',
        cloud_model: 'gpt-4o',
        cloud_api_key: '',
        cloud_provider: '',
    });
    const [models, setModels] = useState([]);
    const [agentPerms, setAgentPerms] = useState({ level: 'Hybrid', override_protection: false });
    const [ollamaStatus, setOllamaStatus] = useState('checking');
    const [saved, setSaved] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);

    useEffect(() => {
        fetchConfig()
            .then(setConfig)
            .catch(() => { });
        fetchPermissions()
            .then(setAgentPerms)
            .catch(() => { });
    }, []);

    const loadModels = useCallback(async () => {
        setLoadingModels(true);
        try {
            const data = await fetchModels();
            setModels(data.models || []);
            setOllamaStatus(data.status || 'offline');
        } catch {
            setModels([]);
            setOllamaStatus('offline');
        } finally {
            setLoadingModels(false);
        }
    }, []);

    useEffect(() => { loadModels(); }, [loadModels]);

    const handleSave = async () => {
        try {
            const result = await updateConfig(config);
            await updatePermissions(agentPerms);
            if (result.config?.cloud_provider) {
                setConfig(prev => ({ ...prev, cloud_provider: result.config.cloud_provider }));
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch { /* handle error */ }
    };

    const selectModel = (modelName) => {
        setConfig({ ...config, local_model: modelName });
        updateConfig({ local_model: modelName }).catch(() => { });
    };

    const detectedProvider = PROVIDER_LABELS[config.cloud_provider] || '';

    return (
        <div className="settings-view">
            <div className="settings-header">
                <img src="/Luminalogo.png" alt="Lumina Logo" className="settings-logo lumina-icon" />
                <div>
                    <h2>Configurações</h2>
                    <p>Gerencie as conexões neurais da sua Lumina IDE</p>
                </div>
            </div>

            {/* Ollama Connection */}
            <div className="settings-card">
                <div className="settings-card-header">
                    <span className="icon">🔌</span>
                    <h3>Conexão Ollama Local</h3>
                </div>
                <div className="settings-card-body">
                    <div className="setting-row-flex">
                        <div className="setting-field">
                            <label>Host / IP</label>
                            <input
                                className="settings-input"
                                value={config.ollama_host}
                                onChange={(e) => setConfig({ ...config, ollama_host: e.target.value })}
                                placeholder="127.0.0.1"
                            />
                        </div>
                        <div className="setting-field">
                            <label>Porta</label>
                            <input
                                className="settings-input"
                                type="number"
                                value={config.ollama_port}
                                onChange={(e) => setConfig({ ...config, ollama_port: Number(e.target.value) })}
                                placeholder="11434"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Autonomy & Protection */}
            <div className="settings-card">
                <div className="settings-card-header">
                    <span className="icon">🛡️</span>
                    <h3>Autonomia e Proteção do Agente</h3>
                </div>
                <div className="settings-card-body">
                    <div className="setting-field" style={{ marginBottom: '16px' }}>
                        <label>Nível de Autonomia</label>
                        <select
                            className="settings-input"
                            style={{ cursor: 'pointer' }}
                            value={agentPerms.level}
                            onChange={e => setAgentPerms({ ...agentPerms, level: e.target.value })}
                        >
                            <option value="Manual">🛠️ Manual (Agente pede aprovação antes de alterar arquivos)</option>
                            <option value="Hybrid">⚖️ Híbrido (Agente altera arquivos com segurança moderada)</option>
                            <option value="Agent">🤖 Autônomo (Agente gerencia todo o ambiente livremente)</option>
                        </select>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Modos Manual exigirão cliques de "Aprovar" dentro do painel após cada geração de código do Agente.
                        </p>
                    </div>

                    <div className="setting-field" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="checkbox"
                            id="bypassProtection"
                            checked={agentPerms.override_protection}
                            onChange={e => setAgentPerms({ ...agentPerms, override_protection: e.target.checked })}
                        />
                        <label htmlFor="bypassProtection" style={{ margin: 0, cursor: 'pointer', color: 'var(--accent-red)' }}>
                            Desativar "Core Protection List" (Bypass System Protection)
                        </label>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', marginLeft: '24px' }}>
                        CUIDADO: Isso permite que a IA altere o código-fonte da própria IDE Lumina diretamente.
                    </p>
                </div>
            </div>

            {/* Local Models */}
            <div className="settings-card">
                <div className="settings-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="icon">🧠</span>
                        <h3>Modelos Locais</h3>
                    </div>
                    <button className="settings-refresh-btn" onClick={loadModels} disabled={loadingModels}>
                        {loadingModels ? '⏳' : '🔄'} Buscar
                    </button>
                </div>
                <div className="settings-card-body">
                    {ollamaStatus === 'offline' && (
                        <div className="settings-alert error">
                            ⚠️ Ollama offline. Verifique se o servidor está rodando na porta {config.ollama_port}.
                        </div>
                    )}

                    {models.length > 0 ? (
                        <div className="model-grid">
                            {models.map((m) => (
                                <div
                                    key={m.name}
                                    className={`model-card ${config.local_model === m.name ? 'selected' : ''}`}
                                    onClick={() => selectModel(m.name)}
                                >
                                    <div className="model-card-header">
                                        <span className="model-name">{m.name}</span>
                                        {config.local_model === m.name && (
                                            <span className="model-active-badge">ATIVO</span>
                                        )}
                                    </div>
                                    <div className="model-card-details">
                                        {m.parameter_size && <span className="model-tag">{m.parameter_size}</span>}
                                        {m.family && <span className="model-tag">{m.family}</span>}
                                        {m.quantization && <span className="model-tag">{m.quantization}</span>}
                                        <span className="model-tag size">{m.size_gb} GB</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        ollamaStatus === 'connected' && (
                            <div className="settings-alert info">
                                Nenhum modelo encontrado. Abra o terminal e use <code>ollama pull mistral</code> para baixar um modelo.
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Cloud API */}
            <div className="settings-card">
                <div className="settings-card-header">
                    <span className="icon">☁️</span>
                    <h3>Provedor Cloud</h3>
                </div>
                <div className="settings-card-body">
                    <div className="setting-field" style={{ marginBottom: '12px' }}>
                        <label>Modelo Cloud (Fallback)</label>
                        <input
                            className="settings-input"
                            value={config.cloud_model}
                            onChange={(e) => setConfig({ ...config, cloud_model: e.target.value })}
                            placeholder="gpt-4o / claude-3.5-sonnet"
                        />
                    </div>
                    <div className="setting-field">
                        <label>
                            API Key
                            {config.has_cloud_key && <span className="settings-badge success">Adicionada</span>}
                        </label>
                        <input
                            className="settings-input"
                            type="password"
                            value={config.cloud_api_key || ''}
                            onChange={(e) => setConfig({ ...config, cloud_api_key: e.target.value })}
                            placeholder="sk-... / sk-ant-..."
                        />
                    </div>
                    {detectedProvider && (
                        <div className="provider-detected">
                            Provedor detectado via Chave: <span className="settings-badge neon">{detectedProvider}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Theme */}
            <div className="settings-card">
                <div className="settings-card-header">
                    <h3>🎨 Tema da Interface</h3>
                </div>
                <div className="settings-card-body">
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            className={`settings-theme-btn ${document.documentElement.getAttribute('data-theme') !== 'light' ? 'active' : ''}`}
                            onClick={() => {
                                document.documentElement.removeAttribute('data-theme');
                                localStorage.setItem('lumina-theme', 'dark');
                                setConfig({ ...config, _theme: 'dark' }); // force re-render
                            }}
                        >
                            🌙 Dark
                        </button>
                        <button
                            className={`settings-theme-btn ${document.documentElement.getAttribute('data-theme') === 'light' ? 'active' : ''}`}
                            onClick={() => {
                                document.documentElement.setAttribute('data-theme', 'light');
                                localStorage.setItem('lumina-theme', 'light');
                                setConfig({ ...config, _theme: 'light' }); // force re-render
                            }}
                        >
                            ☀️ Light
                        </button>
                    </div>
                </div>
            </div>

            <div className="settings-footer">
                <button className={`settings-save-btn ${saved ? 'saved' : ''}`} onClick={handleSave}>
                    {saved ? '✓ Configurações Salvas' : '💾 Salvar Configurações'}
                </button>
            </div>
        </div>
    );
}

```

## src\components\StatusBar.jsx

```jsx
import React from 'react';

export default function StatusBar({ mode, model, workspace, tokenCount }) {
    return (
        <div className="status-bar">
            <div className="status-left">
                <span className="status-item clickable" title="Workspace">
                    📁 {workspace ? workspace.split(/[\\/]/).pop() : 'Sem pasta'}
                </span>
            </div>
            <div className="status-right">
                <span className="status-item">
                    {mode === 'local' ? '⚡' : '☁️'} {mode === 'local' ? 'Ollama' : 'Cloud'}
                </span>
                {model && (
                    <span className="status-item" title={`Modelo: ${model}`}>
                        🧠 {model}
                    </span>
                )}
                {tokenCount > 0 && (
                    <span className="status-item" title="Tokens processados nesta sessão">
                        📊 {tokenCount.toLocaleString()} tokens
                    </span>
                )}
                <span className="status-item brand">
                    Lumina IDE v1.0
                </span>
            </div>
        </div>
    );
}

```

## src\components\TabBar.jsx

```jsx
import React from 'react';

const FILE_ICONS = {
    '.py': '🐍', '.js': '🟨', '.jsx': '⚛️', '.ts': '🔷', '.tsx': '⚛️',
    '.html': '🌐', '.css': '🎨', '.json': '📋', '.md': '📝', '.txt': '📄',
    '.yaml': '⚙️', '.yml': '⚙️', '.sql': '🗃️',
};

export default function TabBar({ tabs, activeTab, onSelect, onClose }) {
    if (!tabs || tabs.length === 0) return null;

    return (
        <div className="tab-bar">
            <div className="tab-list">
                {tabs.map(tab => {
                    const ext = '.' + tab.path.split('.').pop();
                    const icon = FILE_ICONS[ext] || '📄';
                    const name = tab.path.split('/').pop();
                    const isActive = activeTab === tab.path;

                    return (
                        <div
                            key={tab.path}
                            className={`tab ${isActive ? 'active' : ''} ${tab.modified ? 'modified' : ''}`}
                            onClick={() => onSelect(tab.path)}
                        >
                            <span className="tab-icon">{icon}</span>
                            <span className="tab-label">{name}</span>
                            {tab.modified && <span className="tab-dot">●</span>}
                            <button
                                className="tab-close-btn"
                                onClick={(e) => { e.stopPropagation(); onClose(tab.path); }}
                            >
                                ×
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

```

## src\components\TelemetryBar.jsx

```jsx
import React, { useState, useEffect } from 'react';
import { fetchDashboard } from '../services/api';

export default function TelemetryBar({ mode, model }) {
    const [data, setData] = useState(null);
    const [ollamaStatus, setOllamaStatus] = useState('checking');

    useEffect(() => {
        const load = () => {
            fetchDashboard()
                .then(d => { setData(d); setOllamaStatus('connected'); })
                .catch(() => setOllamaStatus('disconnected'));
        };
        load();
        const id = setInterval(load, 15000);
        return () => clearInterval(id);
    }, []);

    const totalTokens = data?.total_tokens || 0;
    const costSaved = (totalTokens * 0.00001).toFixed(4); // rough estimate vs cloud

    return (
        <div className="telemetry-bar">
            <div className="telemetry-left">
                <img src="/Luminalogo.png" alt="Lumina" className="telemetry-logo lumina-icon" />
                <span className="telemetry-brand">Lumina IDE</span>
            </div>

            <div className="telemetry-center">
                {/* Ollama Status */}
                <div className={`telemetry-chip ${ollamaStatus}`}>
                    <span className={`status-dot ${ollamaStatus}`} />
                    <span className="chip-label">
                        {ollamaStatus === 'connected' ? 'Ollama' : ollamaStatus === 'checking' ? '...' : 'Offline'}
                    </span>
                    {model && <span className="chip-model">{model}</span>}
                </div>

                {/* Token Counter */}
                <div className="telemetry-chip tokens">
                    <span className="chip-icon">📊</span>
                    <span className="chip-label">{totalTokens.toLocaleString()}</span>
                    <span className="chip-unit">tokens</span>
                </div>

                {/* Cost Saved */}
                {totalTokens > 0 && (
                    <div className="telemetry-chip savings">
                        <span className="chip-icon">💰</span>
                        <span className="chip-label">${costSaved}</span>
                        <span className="chip-unit">economizados</span>
                    </div>
                )}

                {/* Mode */}
                <div className="telemetry-chip mode">
                    <span className="chip-icon">{mode === 'local' ? '⚡' : '☁️'}</span>
                    <span className="chip-label">{mode === 'local' ? 'Local' : 'Cloud'}</span>
                </div>
            </div>

            <div className="telemetry-right">
                <span className="telemetry-time">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    );
}

```

## src\services\api.js

```javascript
/**
 * Lumina IDE Frontend — API Service Layer
 */

const isElectron = window.location.protocol === 'file:';
const BASE_HOST = isElectron ? 'http://127.0.0.1:8000' : '';
const BASE = `${BASE_HOST}/api`;

// ─── Diagnostic Logger ──────────────────────────────────────────────
const _log = (label, ...args) => console.log(`%c[Lumina API] ${label}`, 'color: #7c3aed; font-weight: bold;', ...args);

// ─── Health Check (for diagnostics) ─────────────────────────────────
export const checkHealth = () =>
    fetch(`${BASE}/health`)
        .then(r => r.json())
        .then(data => { _log('✅ Health', data); return data; })
        .catch(err => { _log('❌ Health FAILED', err.message); throw err; });

// ─── Dashboard ──────────────────────────────────────────────────────
export const fetchDashboard = () =>
    fetch(`${BASE}/dashboard`).then((r) => r.json());

// ─── Terminal ───────────────────────────────────────────────────────
export const fetchTerminalLogs = (port) =>
    fetch(`${BASE}/terminal/logs/${port}`).then((r) => r.json());

// ─── Config ─────────────────────────────────────────────────────────
export const fetchConfig = () =>
    fetch(`${BASE}/config`).then((r) => r.json());

export const updateConfig = (config) =>
    fetch(`${BASE}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
    }).then((r) => r.json());

// ─── Extensions ─────────────────────────────────────────────────────
export const fetchExtensions = () =>
    fetch(`${BASE}/extensions/`).then((r) => r.json());

export const fetchExtensionsPath = () =>
    fetch(`${BASE}/extensions/path`).then((r) => r.json());

export const toggleExtension = (id) =>
    fetch(`${BASE}/extensions/${id}/toggle`, { method: 'POST' }).then((r) => r.json());

// ─── Autonomy & Permissions ─────────────────────────────────────────
export const fetchPermissions = () =>
    fetch(`${BASE}/permissions`).then(r => r.json());

export const updatePermissions = (data) =>
    fetch(`${BASE}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then(r => r.json());

export const confirmChanges = (change_id) =>
    fetch(`${BASE}/confirm_changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ change_id }),
    }).then(r => r.json());

// ─── Ollama Models ──────────────────────────────────────────────────
export const fetchModels = () =>
    fetch(`${BASE}/models`).then((r) => r.json());


// ─── Chats ──────────────────────────────────────────────────────────
export const fetchChats = () =>
    fetch(`${BASE}/chats`).then((r) => r.json());

export const createChat = (uid, title = 'Novo Chat') =>
    fetch(`${BASE}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, title }),
    }).then((r) => r.json());

export const updateChat = (uid, data) =>
    fetch(`${BASE}/chats/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then((r) => r.json());

export const deleteChat = (uid) =>
    fetch(`${BASE}/chats/${uid}`, { method: 'DELETE' }).then((r) => r.json());

export const fetchMessages = (uid) =>
    fetch(`${BASE}/chats/${uid}/messages`).then((r) => r.json());

export const addMessage = (uid, role, content, tokens = 0) =>
    fetch(`${BASE}/chats/${uid}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content, tokens }),
    }).then((r) => r.json());

// ─── Workspace / File System ────────────────────────────────────────
const WS = `${BASE_HOST}/api/workspace`;

export const getWorkspace = () =>
    fetch(`${WS}/current`).then((r) => r.json());

export const openFolder = (path) =>
    fetch(`${WS}/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
    }).then((r) => r.json());

export const browseFolder = () =>
    fetch(`${WS}/browse`).then((r) => r.json());

export const getFileTree = () =>
    fetch(`${WS}/tree`).then((r) => r.json());

export const readFile = (path) =>
    fetch(`${WS}/file?path=${encodeURIComponent(path)}`).then((r) => r.json());

export const writeFile = (path, content) =>
    fetch(`${WS}/file`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content }),
    }).then((r) => r.json());

// ─── Autocomplete ───────────────────────────────────────────────────
export const fetchAutocomplete = ({ code, cursorLine, cursorCol, filename, mode }) =>
    fetch(`${BASE}/autocomplete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            code,
            cursor_line: cursorLine,
            cursor_col: cursorCol,
            filename,
            mode,
        }),
    }).then((r) => r.json())
        .then((data) => data.suggestion || '')
        .catch(() => '');

// ─── Setup & Onboarding ───────────────────────────────────────────
export const fetchSetupStatus = () =>
    fetch(`${BASE}/setup/status`).then(r => r.json());

export const triggerInstall = () =>
    fetch(`${BASE}/setup/install`, { method: 'POST' }).then(r => r.json());

export function streamPullModel({ model }, { onToken, onDone, onError }) {
    const controller = new AbortController();

    fetch(`${BASE}/setup/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model }),
        signal: controller.signal,
    })
        .then(async (res) => {
            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data: ')) continue;
                    try {
                        const data = JSON.parse(trimmed.slice(6));
                        if (data.error) onError?.(new Error(data.error));
                        else if (data.done) onDone?.(data);
                        else if (data.status) onToken?.(data.status);
                    } catch { }
                }
            }
            onDone?.({});
        }).catch(err => {
            if (err.name !== 'AbortError') onError?.(err);
        });

    return () => controller.abort();
}

// ─── SSE Streaming ──────────────────────────────────────────────────
export function streamGenerate({ prompt, mode, model, format }, { onToken, onDone, onError, onFiles }) {
    const controller = new AbortController();

    fetch(`${BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode, model, format, stream: true }),
        signal: controller.signal,
    })
        .then(async (res) => {
            if (!res.ok) {
                try {
                    const errBody = await res.json();
                    onError?.(new Error(errBody.detail || `HTTP ${res.status}`));
                } catch {
                    onError?.(new Error(`Erro HTTP ${res.status}: ${res.statusText}`));
                }
                return;
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let gotDone = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data: ')) continue;
                    try {
                        const data = JSON.parse(trimmed.slice(6));
                        if (data.error) {
                            onError?.(new Error(data.error));
                            gotDone = true;
                            return;
                        }
                        if (data.files) {
                            onFiles?.(data.files);
                            continue;
                        }
                        if (data.pending_confirmation) {
                            // NEW: pass it to UI via a callback
                            if (typeof onPendingConfirmation === 'function') {
                                onPendingConfirmation(data.pending_confirmation, data.blocks);
                            } else if (typeof arguments[1].onPendingConfirmation === 'function') {
                                arguments[1].onPendingConfirmation(data.pending_confirmation, data.blocks);
                            }
                            continue;
                        }
                        if (data.metrics) {
                            onDone?.(data.metrics);
                            gotDone = true;
                            continue;
                        }
                        if (data.token !== undefined) {
                            onToken?.(data.token);
                        }
                    } catch { /* skip malformed SSE */ }
                }
            }

            if (!gotDone) onDone?.({});
        })
        .catch((err) => {
            if (err.name !== 'AbortError') {
                onError?.(new Error(
                    err.message === 'Failed to fetch'
                        ? 'Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 8000.'
                        : err.message
                ));
            }
        });

    return () => controller.abort();
}


```

