# FoodSafe Scanner - Web Images Test (V2 - Improved Error Handling)
# Downloads real food label images and tests the API

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$OutputDir = "web-test-images"
)

# Create output directory
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

# Real food label image URLs from reliable sources
$testImages = @(
    @{
        name = "Bread Package Label"
        url = "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=500&fit=crop"
        description = "Whole wheat bread label"
    },
    @{
        name = "Protein Bar"
        url = "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&h=500&fit=crop"
        description = "Protein bar nutrition facts"
    }
)

Write-Host "=== FoodSafe Scanner - Web Images Test ===" -ForegroundColor Green
Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow
Write-Host ""

# Function to convert image file to base64
function Get-FileAsBase64 {
    param([string]$FilePath)
    
    try {
        $fileBytes = [System.IO.File]::ReadAllBytes($FilePath)
        $base64String = [Convert]::ToBase64String($fileBytes)
        
        return @{
            base64 = $base64String
            mimeType = "image/jpeg"
            size = $fileBytes.Length
        }
    }
    catch {
        return $null
    }
}

# Test results storage
$results = @()
$testNum = 0

# Test each image
foreach ($test in $testImages) {
    $testNum++
    $imageFile = Join-Path $OutputDir "image-$testNum.jpg"
    
    Write-Host "Test $testNum/$($testImages.Count): $($test.name)" -ForegroundColor Cyan
    Write-Host "  Description: $($test.description)" -ForegroundColor Gray
    
    # Download image
    Write-Host "  [1/4] Downloading image..." -ForegroundColor Yellow
    try {
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $test.url -OutFile $imageFile -TimeoutSec 15 -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -ErrorAction Stop
        $fileSize = (Get-Item $imageFile).Length
        Write-Host "  OK: Downloaded $fileSize bytes" -ForegroundColor Green
    }
    catch {
        Write-Host "  ERROR: Could not download - $_" -ForegroundColor Red
        $results += @{
            test = $testNum
            name = $test.name
            status = "FAILED"
            error = "Download failed"
        }
        Write-Host ""
        continue
    }
    
    # Read and convert to base64
    Write-Host "  [2/4] Preparing image..." -ForegroundColor Yellow
    $imageData = Get-FileAsBase64 -FilePath $imageFile
    
    if ($null -eq $imageData) {
        Write-Host "  ERROR: Could not read image" -ForegroundColor Red
        $results += @{
            test = $testNum
            name = $test.name
            status = "FAILED"
            error = "Could not read image file"
        }
        Write-Host ""
        continue
    }
    
    Write-Host "  OK: Image prepared ($($imageData.size) bytes)" -ForegroundColor Green
    
    # Call extract-ingredients API
    Write-Host "  [3/4] Extracting ingredients..." -ForegroundColor Yellow
    try {
        $requestBody = @{
            imageBase64 = $imageData.base64
            imageMediaType = $imageData.mimeType
        } | ConvertTo-Json -Compress -ErrorAction Stop
        
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        
        # Use -UseBasicParsing to avoid response handling issues
        $extractResponse = Invoke-WebRequest -Uri "$BaseUrl/api/extract-ingredients" `
            -Method POST `
            -ContentType "application/json" `
            -Body $requestBody `
            -TimeoutSec 120 `
            -UseBasicParsing `
            -ErrorAction Stop
        
        $sw.Stop()
        
        if ($extractResponse.StatusCode -ne 200) {
            Write-Host "  ERROR: API returned status $($extractResponse.StatusCode)" -ForegroundColor Red
            $results += @{
                test = $testNum
                name = $test.name
                status = "FAILED"
                error = "API status: $($extractResponse.StatusCode)"
            }
        }
        else {
            Write-Host "  OK: Response in $($sw.ElapsedMilliseconds)ms" -ForegroundColor Green
            
            $extractData = $extractResponse.Content | ConvertFrom-Json -ErrorAction Stop
            
            if ($extractData.error) {
                Write-Host "  ERROR: $($extractData.error)" -ForegroundColor Red
                $results += @{
                    test = $testNum
                    name = $test.name
                    status = "FAILED"
                    error = $extractData.error
                }
            }
            elseif ($extractData.ingredients.Count -eq 0) {
                Write-Host "  WARNING: No ingredients extracted from image" -ForegroundColor Yellow
                Write-Host "    Confidence: $($extractData.confidence)" -ForegroundColor Gray
                Write-Host "    Language: $($extractData.language_detected)" -ForegroundColor Gray
                
                $results += @{
                    test = $testNum
                    name = $test.name
                    status = "PARTIAL"
                    error = "No ingredients detected"
                    confidence = $extractData.confidence
                    language = $extractData.language_detected
                }
            }
            else {
                Write-Host "  OK: Extracted $($extractData.ingredients.Count) ingredients" -ForegroundColor Green
                Write-Host "    Confidence: $($extractData.confidence)" -ForegroundColor Gray
                Write-Host "    Language: $($extractData.language_detected)" -ForegroundColor Gray
                
                $ingredientList = @()
                for ($j = 0; $j -lt [Math]::Min(5, $extractData.ingredients.Count); $j++) {
                    $ingredientList += $extractData.ingredients[$j].name
                }
                $ingredientStr = $ingredientList -join ', '
                Write-Host "    Ingredients: $ingredientStr" -ForegroundColor Gray
                
                # Call analyze-ingredients API
                Write-Host "  [4/4] Analyzing ingredients..." -ForegroundColor Yellow
                try {
                    $analysisBody = @{
                        ingredients = $extractData.ingredients
                        userAllergies = @()
                    } | ConvertTo-Json -Compress -ErrorAction Stop
                    
                    $sw2 = [System.Diagnostics.Stopwatch]::StartNew()
                    
                    $analysisResponse = Invoke-WebRequest -Uri "$BaseUrl/api/analyze-ingredients" `
                        -Method POST `
                        -ContentType "application/json" `
                        -Body $analysisBody `
                        -TimeoutSec 180 `
                        -UseBasicParsing `
                        -ErrorAction Stop
                    
                    $sw2.Stop()
                    
                    if ($analysisResponse.StatusCode -ne 200) {
                        Write-Host "  ERROR: Analysis API returned status $($analysisResponse.StatusCode)" -ForegroundColor Red
                        $results += @{
                            test = $testNum
                            name = $test.name
                            status = "PARTIAL"
                            error = "Analysis API status: $($analysisResponse.StatusCode)"
                            ingredients = $extractData.ingredients.Count
                        }
                    }
                    else {
                        $analysisData = $analysisResponse.Content | ConvertFrom-Json -ErrorAction Stop
                        
                        Write-Host "  OK: Analysis completed in $($sw2.ElapsedMilliseconds)ms" -ForegroundColor Green
                        
                        if ($analysisData.error) {
                            Write-Host "  ERROR: $($analysisData.error)" -ForegroundColor Red
                            $results += @{
                                test = $testNum
                                name = $test.name
                                status = "PARTIAL"
                                error = $analysisData.error
                                ingredients = $extractData.ingredients.Count
                            }
                        }
                        else {
                            Write-Host "    Risk Score: $($analysisData.product_risk_score)" -ForegroundColor Green
                            Write-Host "    Results: $($analysisData.results.Count) analyzed" -ForegroundColor Gray
                            
                            if ($analysisData.top_concerns -and $analysisData.top_concerns.Count -gt 0) {
                                $concerns = $analysisData.top_concerns -join ', '
                                Write-Host "    Top Concerns: $concerns" -ForegroundColor Yellow
                            }
                            
                            $results += @{
                                test = $testNum
                                name = $test.name
                                status = "SUCCESS"
                                ingredients = $extractData.ingredients.Count
                                riskScore = $analysisData.product_risk_score
                                topConcerns = $analysisData.top_concerns
                                extractTime = $sw.ElapsedMilliseconds
                                analysisTime = $sw2.ElapsedMilliseconds
                            }
                        }
                    }
                }
                catch {
                    $errorMsg = $_.Exception.Message
                    Write-Host "  ERROR: Analysis API failed - $errorMsg" -ForegroundColor Red
                    $results += @{
                        test = $testNum
                        name = $test.name
                        status = "PARTIAL"
                        error = "Analysis API failed: $errorMsg"
                        ingredients = $extractData.ingredients.Count
                    }
                }
            }
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        Write-Host "  ERROR: Extraction API failed - $errorMsg" -ForegroundColor Red
        $results += @{
            test = $testNum
            name = $test.name
            status = "FAILED"
            error = "Extraction API failed: $errorMsg"
        }
    }
    
    Write-Host ""
}

# Summary
Write-Host "=== Test Summary ===" -ForegroundColor Green
$successCount = ($results | Where-Object { $_.status -eq "SUCCESS" }).Count
$partialCount = ($results | Where-Object { $_.status -eq "PARTIAL" }).Count
$failedCount = ($results | Where-Object { $_.status -eq "FAILED" }).Count

Write-Host "Successful: $successCount / $($results.Count)" -ForegroundColor Green
Write-Host "Partial: $partialCount / $($results.Count)" -ForegroundColor Yellow
Write-Host "Failed: $failedCount / $($results.Count)" -ForegroundColor Red

Write-Host ""
Write-Host "=== Detailed Results ===" -ForegroundColor Cyan
$results | ForEach-Object {
    $statusColor = switch($_.status) {
        "SUCCESS" { "Green" }
        "PARTIAL" { "Yellow" }
        "FAILED" { "Red" }
        default { "White" }
    }
    Write-Host "Test $($_.test): $($_.name) - $($_.status)" -ForegroundColor $statusColor
    if ($_.ingredients) {
        Write-Host "  Ingredients: $($_.ingredients)" -ForegroundColor Gray
    }
    if ($_.riskScore) {
        Write-Host "  Risk Score: $($_.riskScore)" -ForegroundColor Gray
    }
    if ($_.topConcerns -and $_.topConcerns.Count -gt 0) {
        Write-Host "  Concerns: $($_.topConcerns -join ', ')" -ForegroundColor Yellow
    }
    if ($_.extractTime) {
        Write-Host "  Extract Time: $($_.extractTime)ms | Analysis Time: $($_.analysisTime)ms" -ForegroundColor Gray
    }
    if ($_.error) {
        Write-Host "  Error: $($_.error)" -ForegroundColor Red
    }
}

# Save results
$reportData = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    imageSource = "Web Images"
    summary = @{
        total = $results.Count
        successful = $successCount
        partial = $partialCount
        failed = $failedCount
        successRate = if ($results.Count -gt 0) { "$([Math]::Round(($successCount / $results.Count) * 100))%" } else { "N/A" }
    }
    tests = $results
}

$reportData | ConvertTo-Json -Depth 3 | Out-File -FilePath "web-test-results.json" -Encoding UTF8
Write-Host ""
Write-Host "Results saved to: web-test-results.json" -ForegroundColor Green
Write-Host "Images saved to: $OutputDir" -ForegroundColor Green
