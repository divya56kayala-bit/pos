
# POS Printer Service Setup

This service allows the web-based POS to print to a local USB Thermal Printer on Windows.

## Prequisites (Windows)

1. **Connect your USB Printer.**
2. **Install Zadig** (Required for `escpos-usb` on Windows):
   - Download from: [https://zadig.akeo.ie/](https://zadig.akeo.ie/)
   - Open Zadig.
   - Options -> List All Devices.
   - Select your USB Printer (e.g. "POS58" or "Unknown Device").
   - **Important**: Change the driver to **WinUSB (v6.1...)**.
   - Click "Replace Driver" / "Install Driver".
   - *This allows Node.js to talk to the USB device directly.*

## Installation

1. Navigate to the service folder:
   ```powershell
   cd d:\bharatgrocery-pos\printer-service
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```

## Running the Service

Start the service in a separate terminal:
```powershell
npm start
```
- It runs on `http://localhost:3333`.
- The POS Backend can send print requests to this URL.

## API Usage

**POST** `http://localhost:3333/print`

Body:
```json
{
  "receipt": {
    "shopName": "Bharat Grocery",
    "billNo": "INV-1001",
    "items": [
      { "name": "Rice", "qty": 1, "price": 50 }
    ],
    "grandTotal": 50,
    "paymentMode": "Cash"
  }
}
```
