import base64
import json
import mimetypes
import os


def make_data_urls(file_paths, output_path):
    result = {
        "1px": (
            # カッコ内に文字列リテラルを並べたものは結合される（隣接置換）
            "data:image/png;base64,"
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAA"
            "AAYAAjCB0C8AAAAASUVORK5CYII="
        ),
    }

    for path in file_paths:
        if not os.path.exists(path):
            print(f"{path} not found")
            continue

        mime_type, _ = mimetypes.guess_type(path)
        if not mime_type:
            mime_type = "application/octet-stream"

        try:
            with open(path, "rb") as f:
                base64_str = base64.b64encode(f.read()).decode("utf-8")
                data_url = f"data:{mime_type};base64,{base64_str}"
                result[path] = data_url
        except Exception as e:
            print(f"ERROR: {path}: {e}")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("const dataUrls = ")
        json.dump(result, f, indent=0)
        f.write(";\n")

    print(f"CREATED: {output_path}")


if __name__ == "__main__":
    image_files = [
        "tex/daisy.webp",
    ]
    make_data_urls(image_files, "data-urls.js")
