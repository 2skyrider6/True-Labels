# FoodSafe Scanner Test Script - V2
# Tests the app with 10 food label images from accessible sources

param(
    [string]$BaseUrl = "http://localhost:3000"
)

# Array of food label image URLs to test (using more reliable sources)
$testImages = @(
    @{
        name = "Nutrition Label 1"
        url = "https://images.unsplash.com/photo-1584621694145-41d6e3c64eec?w=400"
        description = "Generic nutrition label"
    },
    @{
        name = "Cereal Box"
        url = "https://images.unsplash.com/photo-1585238341710-4913d3a3a48f?w=400"
        description = "Breakfast cereal box"
    },
    @{
        name = "Snack Package"
        url = "https://images.unsplash.com/photo-1599599810694-b5ac4dd4e4a6?w=400"
        description = "Processed snack"
    },
    @{
        name = "Beverage Label"
        url = "https://images.unsplash.com/photo-1554224311-beee415c201f?w=400"
        description = "Drink bottle label"
    },
    @{
        name = "Food Package"
        url = "https://images.unsplash.com/photo-1578826539167-186a50c3f3f1?w=400"
        description = "Food product packaging"
    },
    @{
        name = "Candy Package"
        url = "https://images.unsplash.com/photo-1599599810694-b5ac4dd4e4a6?w=400"
        description = "Candy/sweet packaging"
    },
    @{
        name = "Baking Ingredient"
        url = "https://images.unsplash.com/photo-1548868019-1520f0ddf738?w=400"
        description = "Baking ingredient packaging"
    },
    @{
        name = "Dairy Product"
        url = "https://images.unsplash.com/photo-1628840042765-356cda07f4ee?w=400"
        description = "Dairy product label"
    },
    @{
        name = "Sauce Label"
        url = "https://images.unsplash.com/photo-1585238341710-4913d3a3a48f?w=400"
        description = "Sauce/condiment label"
    },
    @{
        name = "Protein Product"
        url = "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400"
        description = "Protein bar/shake"
    }
)

Write-Host "=== FoodSafe Scanner Test Suite ===" -ForegroundColor Green
Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow
Write-Host "Total tests: $($testImages.Count)" -ForegroundColor Yellow
Write-Host ""

# Function to convert image URL to base64
function Get-ImageAsBase64 {
    param([string]$ImageUrl)
    
    try {
        $response = Invoke-WebRequest -Uri $ImageUrl -TimeoutSec 15 -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        $imageBytes = $response.Content
        $base64String = [Convert]::ToBase64String($imageBytes)
        
        # Determine MIME type from response headers
        $contentType = $response.Headers["Content-Type"]
        if ($null -eq $contentType) {
            $contentType = "image/jpeg"
        }
        
        return @{
            base64 = $base64String
            mimeType = $contentType
            size = $imageBytes.Length
        }
    }
    catch {
        Write-Host "Error downloading image: $_" -ForegroundColor Red
        return $null
    }
}

# Test results storage
$results = @()

# Run tests
for ($i = 0; $i -lt $testImages.Count; $i++) {
    $test = $testImages[$i]
    $testNum = $i + 1
    
    Write-Host "Test $testNum/$($testImages.Count): $($test.name)" -ForegroundColor Cyan
    Write-Host "  Description: $($test.description)" -ForegroundColor Gray
    
    # Download and convert image
    Write-Host "  [1/3] Downloading image..." -ForegroundColor Yellow
    $imageData = Get-ImageAsBase64 -ImageUrl $test.url
    
    if ($null -eq $imageData) {
        Write-Host "  FAILED to download image" -ForegroundColor Red
        $results += @{
            test = $testNum
            name = $test.name
            status = "FAILED"
            error = "Could not download image"
            extraction = $null
            analysis = $null
        }
        Write-Host ""
        continue
    }
    
    Write-Host "  OK: Downloaded $($imageData.size) bytes" -ForegroundColor Green
    
    # Call extract-ingredients API
    Write-Host "  [2/3] Extracting ingredients..." -ForegroundColor Yellow
    try {
        $requestBody = @{
            imageBase64 = $imageData.base64
            imageMediaType = $imageData.mimeType
        } | ConvertTo-Json
        
        $extractResponse = Invoke-WebRequest -Uri "$BaseUrl/api/extract-ingredients" `
            -Method POST `
            -ContentType "application/json" `
            -Body $requestBody `
            -TimeoutSec 60
        
        $extractData = $extractResponse.Content | ConvertFrom-Json
        
        if ($extractData.error) {
            Write-Host "  ERROR: $($extractData.error)" -ForegroundColor Red
            $results += @{
                test = $testNum
                name = $test.name
                status = "FAILED"
                error = $extractData.error
                extraction = $null
                analysis = $null
            }
        }
        else {
            Write-Host "  OK: Extracted $($extractData.ingredients.Count) ingredients" -ForegroundColor Green
            Write-Host "    Confidence: $($extractData.confidence)" -ForegroundColor Gray
            Write-Host "    Language: $($extractData.language_detected)" -ForegroundColor Gray
            
            if ($extractData.ingredients.Count -gt 0) {
                $ingredientList = @()
                for ($j = 0; $j -lt [Math]::Min(3, $extractData.ingredients.Count); $j++) {
                    $ingredientList += $extractData.ingredients[$j].name
                }
                $ingredientStr = $ingredientList -join ', '
                Write-Host "    Ingredients: $ingredientStr..." -ForegroundColor Gray
            }
            else {
                Write-Host "    WARNING: No ingredients extracted" -ForegroundColor Yellow
            }
            
            # Call analyze-ingredients API (only if we have ingredients)
            if ($extractData.ingredients.Count -gt 0) {
                Write-Host "  [3/3] Analyzing ingredients..." -ForegroundColor Yellow
                try {
                    $analysisBody = @{
                        ingredients = $extractData.ingredients
                        userAllergies = @()
                    } | ConvertTo-Json
                    
                    $analysisResponse = Invoke-WebRequest -Uri "$BaseUrl/api/analyze-ingredients" `
                        -Method POST `
                        -ContentType "application/json" `
                        -Body $analysisBody `
                        -TimeoutSec 90
                    
                    $analysisData = $analysisResponse.Content | ConvertFrom-Json
                    
                    if ($analysisData.error) {
                        Write-Host "  ERROR: $($analysisData.error)" -ForegroundColor Red
                        $results += @{
                            test = $testNum
                            name = $test.name
                            status = "PARTIAL"
                            error = $analysisData.error
                            extraction = $extractData
                            analysis = $null
                        }
                    }
                    else {
                        Write-Host "  OK: Analysis complete" -ForegroundColor Green
                        Write-Host "    Risk Score: $($analysisData.product_risk_score)" -ForegroundColor Gray
                        if ($analysisData.top_concerns -and $analysisData.top_concerns.Count -gt 0) {
                            $concerns = $analysisData.top_concerns -join ', '
                            Write-Host "    Top Concerns: $concerns" -ForegroundColor Yellow
                        }
                        
                        Write-Host "    Results Count: $($analysisData.results.Count) ingredients analyzed" -ForegroundColor Gray
                        
                        $results += @{
                            test = $testNum
                            name = $test.name
                            status = "SUCCESS"
                            error = $null
                            extraction = $extractData
                            analysis = $analysisData
                        }
                    }
                }
                catch {
                    $errorMsg = $_.Exception.Message
                    Write-Host "  ERROR: Analysis API failed: $errorMsg" -ForegroundColor Red
                    $results += @{
                        test = $testNum
                        name = $test.name
                        status = "PARTIAL"
                        error = "Analysis API failed: $errorMsg"
                        extraction = $extractData
                        analysis = $null
                    }
                }
            }
            else {
                Write-Host "  SKIP: Skipping analysis - no ingredients to analyze" -ForegroundColor Yellow
                $results += @{
                    test = $testNum
                    name = $test.name
                    status = "PARTIAL"
                    error = "No ingredients extracted from image"
                    extraction = $extractData
                    analysis = $null
                }
            }
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        Write-Host "  ERROR: Extraction API failed: $errorMsg" -ForegroundColor Red
        $results += @{
            test = $testNum
            name = $test.name
            status = "FAILED"
            error = "Extraction API failed: $errorMsg"
            extraction = $null
            analysis = $null
        }
    }
    
    Write-Host ""
}

# Summary
Write-Host "=== Test Summary ===" -ForegroundColor Green
$successCount = ($results | Where-Object { $_.status -eq "SUCCESS" }).Count
$partialCount = ($results | Where-Object { $_.status -eq "PARTIAL" }).Count
$failedCount = ($results | Where-Object { $_.status -eq "FAILED" }).Count

Write-Host "Successful: $successCount / $($testImages.Count)" -ForegroundColor Green
Write-Host "Partial: $partialCount / $($testImages.Count)" -ForegroundColor Yellow
Write-Host "Failed: $failedCount / $($testImages.Count)" -ForegroundColor Red

Write-Host ""
Write-Host "Detailed Results:" -ForegroundColor Cyan
$results | ForEach-Object {
    $statusColor = switch($_.status) {
        "SUCCESS" { "Green" }
        "PARTIAL" { "Yellow" }
        "FAILED" { "Red" }
        default { "White" }
    }
    Write-Host "Test $($_.test): $($_.name) - $($_.status)" -ForegroundColor $statusColor
    if ($_.error) {
        Write-Host "  Error: $($_.error)" -ForegroundColor Red
    }
}

# Save detailed results to file
$reportData = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    summary = @{
        total = $testImages.Count
        successful = $successCount
        partial = $partialCount
        failed = $failedCount
    }
    tests = $results
}

$reportData | ConvertTo-Json -Depth 3 | Out-File -FilePath "test-results.json" -Encoding UTF8
Write-Host ""
Write-Host "Detailed report saved to: test-results.json" -ForegroundColor Green
