# OCR Setup for Invoice Processing

Invoice processing extracts text from PDFs in two ways:

1. **Text-based PDFs** – Direct extraction via PyMuPDF (no extra setup).
2. **Image-based / scanned PDFs** – OCR via Tesseract (needs installation).

---

## When Tesseract is required

If your invoice PDFs are **scanned images** (e.g. photos or scanned documents), Tesseract is required. Text-based PDFs created by software work without Tesseract.

---

## Installing Tesseract on Windows

### Option 1: Chocolatey
```powershell
choco install tesseract
```

### Option 2: Direct download
1. Go to [Tesseract at UB Mannheim](https://github.com/UB-Mannheim/tesseract/wiki)
2. Download the Windows installer
3. Run the installer (e.g. `tesseract-ocr-w64-setup-5.3.3.exe`)
4. During install, check "Additional language data" and select **English** and **Hindi** (for Indian invoices)
5. Add Tesseract to PATH, or set `TESSDATA_PREFIX` if needed

### Option 3: Manual PATH
If Tesseract is installed but not in PATH, add its folder to your PATH (e.g. `C:\Program Files\Tesseract-OCR`).

---

## Verifying installation

```powershell
tesseract --version
```

If you see a version string, Tesseract is installed correctly.

---

## File path note

The file path **`C:\Users\Ram\Downloads\Doc1.pdf`** is the original location on your computer. When you upload an invoice through the web app:

1. The browser sends the file content to the backend.
2. The backend saves it under `backend/uploads/<business_id>/<uuid>.pdf`.
3. Processing uses that saved path, not the original Downloads path.

To test with a specific file locally, you can run:
```powershell
py diagnose_invoice.py
```
(Edit `diagnose_invoice.py` to change `test_file` if needed.)
