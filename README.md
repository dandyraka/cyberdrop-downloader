# CyberDrop Downloader

CyberDrop Downloader is a Node command-line tool for downloading entire albums from the CyberDrop host.

The tool creates a new folder in the current directory using the album name, and downloads all files using their original filenames (strips UID). Downloads are performed in parallel by default, or can be done sequentially using the `--sequential` parameter.

## Installation

```bash
npm i cyberdrop-downloader -g
```

## Usage

```bash
cyberdrop https://cyberdrop.me/a/XXXXXXXX

Alias: cyberdrop or cb
Param 1: (required) URL
Param 2: (optional) --sequential or -s
```

## Example Output

```bash
$ cyberdrop https://cyberdrop.me/a/XXXXXXXX
FolderName
Starting Download..
[01/10] File 1.jpg -> [======================] 100% 0.0s
[02/10] File 2.jpg -> [======================] 100% 0.0s
[03/10] File 3.jpg -> [======================] 100% 0.0s
[04/10] File 4.jpg -> [====                  ] 15%  3.5s
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)