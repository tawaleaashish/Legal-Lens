import pymupdf
import pymupdf4llm

doc=pymupdf.open("E:\Mega Project\constitution of india 3.pdf")
md=pymupdf4llm.to_markdown(doc)
with open("temp.md", "w", encoding="utf-8") as f:
    f.write(md)
    # asdadewfcfvdsfc