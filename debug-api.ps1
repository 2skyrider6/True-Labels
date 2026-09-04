$imageFile = "test-images\test-1.jpg"
$fileBytes = [System.IO.File]::ReadAllBytes($imageFile)
$base64String = [Convert]::ToBase64String($fileBytes)

$json = @{
    imageBase64 = $base64String
    imageMediaType = "image/jpeg"
} | ConvertTo-Json

Write-Host "Calling API..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/extract-ingredients" `
        -Method POST `
        -ContentType "application/json" `
        -Body $json `
        -TimeoutSec 180
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host ""
    Write-Host "Response Content:" -ForegroundColor Cyan
    $data | ConvertTo-Json -Depth 5 | Write-Host
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseContent = $reader.ReadToEnd()
        Write-Host "Response: $responseContent" -ForegroundColor Yellow
    }
}
