import os
from PIL import Image
from rembg import remove

input_path = r"C:\Users\Ammar\Desktop\690618619_995117156379756_6890570452760555585_n - Copy.jpg"
web_output_path = r"d:\Files\Programming_Projects\Euro Store\apps\web\public\images\logo.png"
admin_output_path = r"d:\Files\Programming_Projects\Euro Store\apps\admin\public\logo.png"

print("Loading input image...")
input_image = Image.open(input_path)

print("Removing background...")
output_image = remove(input_image)

print("Saving to web public directory...")
output_image.save(web_output_path)

print("Saving to admin public directory...")
output_image.save(admin_output_path)

print("Done!")
