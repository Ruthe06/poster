import base64
import os

def to_base64(path):
    with open(path, "rb") as image_file:
        return f"data:image/png;base64,{base64.b64encode(image_file.read()).decode('utf-8')}"

try:
    # Using jewellery-banner.png for User 1
    b1 = to_base64("d:/p/assets/jewellery-banner.png")
    b2 = to_base64("d:/p/assets/banner2.png")

    with open("d:/p/js/banners.js", "w") as f:
        f.write(f"const BANNERS = {{\n  '1': '{b1}',\n  '2': '{b2}'\n}};")
    print("Success")
except Exception as e:
    print(f"Error: {e}")
