$ErrorActionPreference = "Stop"

function Get-Token ($email, $password) {
    try {
        $body = @{ email = $email; password = $password } | ConvertTo-Json
        $res = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
        return $res.token
    } catch { return $null }
}

$token = Get-Token "admin@pos.com" "adminpassword"
$headers = @{ Authorization = "Bearer $token" }

# 1. Generate unique phone
$phone = "807489" + (Get-Random -Minimum 1000 -Maximum 9999)
Write-Host "Testing with Phone: $phone"

# 2. Create Bill with Customer object (Simulating Fixed POS)
$billData = @{
    items = @(@{ productId = "123"; name = "Test Item"; qty = 1; price = 10; gst = 0 });
    totalAmount = 10;
    subTotal = 10;
    taxAmount = 0;
    paymentMode = "Cash";
    employeeName = "Tester";
    customer = @{ name = "AutoTest User"; phone = $phone };
    customerName = "AutoTest User";
    customerPhone = $phone
} | ConvertTo-Json

try {
    Write-Host "Creating Bill..."
    $bill = Invoke-RestMethod -Uri "http://localhost:5000/api/bills" -Method Post -Body $billData -Headers $headers -ContentType "application/json"
    Write-Host "Bill Created: $($bill.billNo)"
} catch {
    $msg = "Bill Creation Failed: $($_.Exception.Message)"
    Write-Host $msg
    $msg | Set-Content "error.log"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
        $body = $reader.ReadToEnd()
        Write-Host "Server Response: $body"
        $body | Add-Content "error.log" # Use Add-Content for appending
    }
}

# 3. Verify Customer Created
try {
    Write-Host "Checking if Customer exists..."
    $cust = Invoke-RestMethod -Uri "http://localhost:5000/api/customers/phone/$phone" -Method Get -Headers $headers
    Write-Host "SUCCESS: Customer Found - $($cust.name) ($($cust.phone))"
    
    if ($cust.orderIds.Count -gt 0) {
        Write-Host "SUCCESS: Order Linked! Order Count: $($cust.orderIds.Count)"
    } else {
        Write-Error "FAILURE: Customer exists but Order ID NOT linked."
    }
} catch {
    Write-Error "FAILURE: Customer was NOT created (404)."
}
