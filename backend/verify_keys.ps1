$ErrorActionPreference = "Stop"

try {
    Write-Host "1. Logging in..."
    $loginUrl = "http://localhost:5000/api/auth/login"
    $body = @{ email = "admin@pos.com"; password = "adminpassword" } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $body -ContentType "application/json"
    $token = $response.token
    Write-Host "   Token received."

    Write-Host "`n2. Checking Report Summary Keys..."
    $reportUrl = "http://localhost:5000/api/reports/summary"
    $headers = @{ Authorization = "Bearer $token" }
    $reportResponse = Invoke-RestMethod -Uri $reportUrl -Method Get -Headers $headers
    
    Write-Host "   Response Keys:"
    $reportResponse.PSObject.Properties.Name

    if ($reportResponse.PSObject.Properties.Name -contains "todaySales") {
        Write-Host "`n[SUCCESS] Key 'todaySales' found!"
    } else {
        Write-Host "`n[FAILURE] Key 'todaySales' NOT found!"
    }

} catch {
    Write-Error $_
}
