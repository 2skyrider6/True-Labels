# FoodSafe Scanner - Comprehensive Web Images Test
# Final test with real food product images

param(
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "=== FoodSafe Scanner - Final Web Images Test ===" -ForegroundColor Green
Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow
Write-Host "Testing with real product images from the web" -ForegroundColor Yellow
Write-Host ""

# Direct URLs to real food product images with visible nutrition labels
$testImages = @(
    @{
        name = "Product Image 1"
        url = "https://images.unsplash.com/photo-1585070526059-41b3d63e4220?w=800"
        description = "Food packaging with label"
    },
    @{
        name = "Product Image 2"
        url = "https://images.unsplash.com/photo-1599599810694-b5ac4dd4e4a6?w=800"
        description = "Product with nutrition info"
    },
    @{
        name = "Product Image 3"
        url = "https://images.unsplash.com/photo-1557821552-17105176677c?w=800"
        description = "Grocery item packaging"
    },
    @{
        name = "Product Image 4"
        url = "https://images.unsplash.com/photo-1488477304112-4bae1a6978f9?w=800"
        description = "Dairy product label"
    },
    @{
        name = "Product Image 5"
        url = "https://images.unsplash.com/photo-1604068549290-daea0aa2d83e?w=800"
        description = "Frozen food package"
    }
)

$results = @()
$testNum = 0

foreach ($test in $testImages) {
    $testNum++
    
    Write-Host "Test $testNum/$($testImages.Count): $($test.name)" -ForegroundColor Cyan
    Write-Host "  Description: $($test.description)" -ForegroundColor Gray
    
    try {
        # Download image
        Write-Host "  [1/3] Downloading..." -ForegroundColor Yellow
        $tempFile = [System.IO.Path]::GetTempFileName() + ".jpg"
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $test.url -OutFile $tempFile -TimeoutSec 15 -UserAgent "Mozilla/5.0" -ErrorAction Stop
        
        $fileSize = (Get-Item $tempFile).Length
        Write-Host "    OK: $fileSize bytes" -ForegroundColor Green
        
        # Convert to base64
        $fileBytes = [System.IO.File]::ReadAllBytes($tempFile)
        $base64String = [Convert]::ToBase64String($fileBytes)
        
        # Extract ingredients
        Write-Host "  [2/3] Extracting ingredients..." -ForegroundColor Yellow
        $requestBody = @{
            imageBase64 = $base64String
            imageMediaType = "image/jpeg"
        } | ConvertTo-Json -Compress
        
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $extractResponse = Invoke-WebRequest -Uri "$BaseUrl/api/extract-ingredients" `
            -Method POST `
            -ContentType "application/json" `
            -Body $requestBody `
            -TimeoutSec 120 `
            -UseBasicParsing
        $sw.Stop()
        
        $extractData = $extractResponse.Content | ConvertFrom-Json
        
        Write-Host "    OK: $($sw.ElapsedMilliseconds)ms" -ForegroundColor Green
        Write-Host "    Ingredients: $($extractData.ingredients.Count)" -ForegroundColor Gray
        Write-Host "    Confidence: $($extractData.confidence)" -ForegroundColor Gray
        
        if ($extractData.ingredients.Count -gt 0) {
            # Analyze ingredients
            Write-Host "  [3/3] Analyzing..." -ForegroundColor Yellow
            
            $analysisBody = @{
                ingredients = $extractData.ingredients
                userAllergies = @()
            } | ConvertTo-Json -Compress
            
            $sw2 = [System.Diagnostics.Stopwatch]::StartNew()
            $analysisResponse = Invoke-WebRequest -Uri "$BaseUrl/api/analyze-ingredients" `
                -Method POST `
                -ContentType "application/json" `
                -Body $analysisBody `
                -TimeoutSec 180 `
                -UseBasicParsing
            $sw2.Stop()
            
            $analysisData = $analysisResponse.Content | ConvertFrom-Json
            
            Write-Host "    OK: $($sw2.ElapsedMilliseconds)ms" -ForegroundColor Green
            Write-Host "    Risk: $($analysisData.product_risk_score)" -ForegroundColor Green
            
            if ($analysisData.top_concerns.Count -gt 0) {
                Write-Host "    Concerns: $($analysisData.top_concerns -join ', ')" -ForegroundColor Yellow
            }
            
            $results += @{
                test = $testNum
                name = $test.name
                status = "SUCCESS"
                ingredients = $extractData.ingredients.Count
                confidence = $extractData.confidence
                riskScore = $analysisData.product_risk_score
                concerns = $analysisData.top_concerns
                extractTime = $sw.ElapsedMilliseconds
                analysisTime = $sw2.ElapsedMilliseconds
            }
        }
        else {
            Write-Host "  WARNING: No ingredients detected in image" -ForegroundColor Yellow
            
            $results += @{
                test = $testNum
                name = $test.name
                status = "PARTIAL"
                ingredients = 0
                confidence = $extractData.confidence
                message = "Image does not contain clear ingredient labels"
            }
        }
        
        # Cleanup
        Remove-Item $tempFile -ErrorAction SilentlyContinue
    }
    catch {
        $errorMsg = $_.Exception.Message
        Write-Host "  ERROR: $errorMsg" -ForegroundColor Red
        
        $results += @{
            test = $testNum
            name = $test.name
            status = "FAILED"
            error = $errorMsg
        }
    }
    
    Write-Host ""
}

# Final Summary
Write-Host "=== Test Results Summary ===" -ForegroundColor Green
Write-Host ""

$successCount = ($results | Where-Object { $_.status -eq "SUCCESS" }).Count
$partialCount = ($results | Where-Object { $_.status -eq "PARTIAL" }).Count
$failedCount = ($results | Where-Object { $_.status -eq "FAILED" }).Count

Write-Host "Total Tests: $($results.Count)" -ForegroundColor Cyan
Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Partial: $partialCount" -ForegroundColor Yellow
Write-Host "Failed: $failedCount" -ForegroundColor Red
Write-Host ""

if ($successCount -gt 0) {
    Write-Host "=== Successful Tests ===" -ForegroundColor Green
    $results | Where-Object { $_.status -eq "SUCCESS" } | ForEach-Object {
        Write-Host "Test $($_.test): $($_.name)" -ForegroundColor Green
        Write-Host "  Ingredients: $($_.ingredients) | Risk: $($_.riskScore)" -ForegroundColor Gray
        Write-Host "  Time: Extract=$($_.extractTime)ms | Analysis=$($_.analysisTime)ms" -ForegroundColor Gray
        if ($_.concerns -and $_.concerns.Count -gt 0) {
            Write-Host "  Concerns: $($_.concerns -join ', ')" -ForegroundColor Yellow
        }
    }
}

if ($partialCount -gt 0) {
    Write-Host ""
    Write-Host "=== Partial Tests ===" -ForegroundColor Yellow
    $results | Where-Object { $_.status -eq "PARTIAL" } | ForEach-Object {
        Write-Host "Test $($_.test): $($_.name)" -ForegroundColor Yellow
        Write-Host "  Message: $($_.message)" -ForegroundColor Gray
    }
}

if ($failedCount -gt 0) {
    Write-Host ""
    Write-Host "=== Failed Tests ===" -ForegroundColor Red
    $results | Where-Object { $_.status -eq "FAILED" } | ForEach-Object {
        Write-Host "Test $($_.test): $($_.name)" -ForegroundColor Red
        Write-Host "  Error: $($_.error)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== Overall Assessment ===" -ForegroundColor Green

$successRate = if ($results.Count -gt 0) { [Math]::Round(($successCount / $results.Count) * 100) } else { 0 }
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 50) { "Green" } else { "Yellow" })

if ($successRate -ge 80) {
    Write-Host "Status: EXCELLENT - App is working well!" -ForegroundColor Green
}
elseif ($successRate -ge 50) {
    Write-Host "Status: GOOD - App is functional with some issues" -ForegroundColor Yellow
}
else {
    Write-Host "Status: NEEDS ATTENTION - Multiple failures detected" -ForegroundColor Red
}

# Export results
$results | ConvertTo-Json -Depth 3 | Out-File "final-test-report.json"
Write-Host ""
Write-Host "Report saved to: final-test-report.json" -ForegroundColor Cyan
