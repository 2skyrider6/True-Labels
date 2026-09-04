# Create test images and test the FoodSafe Scanner API

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$OutputDir = "test-images"
)

# Create output directory
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

# Function to create a simple test image with text
function Create-TestImage {
    param(
        [string]$FilePath,
        [string]$Label
    )
    
    # Create a simple image using PowerShell GDI+
    [System.Reflection.Assembly]::LoadWithPartialName("System.Drawing") | Out-Null
    
    $bitmap = New-Object System.Drawing.Bitmap(400, 300)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Fill background
    $graphics.Clear([System.Drawing.Color]::White)
    
    # Draw border
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::Black, 2)
    $graphics.DrawRectangle($pen, 0, 0, 399, 299)
    
    # Draw text
    $font = New-Object System.Drawing.Font("Arial", 14, [System.Drawing.FontStyle]::Bold)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
    $graphics.DrawString("NUTRITION FACTS", $font, $brush, 10, 10)
    
    $font2 = New-Object System.Drawing.Font("Arial", 10)
    $graphics.DrawString($Label, $font2, $brush, 10, 50)
    
    # Draw sample ingredients
    $font3 = New-Object System.Drawing.Font("Arial", 8)
    $graphics.DrawString("INGREDIENTS:", $font3, $brush, 10, 100)
    $graphics.DrawString($Label, $font3, $brush, 10, 130)
    
    $bitmap.Save($FilePath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $graphics.Dispose()
    $bitmap.Dispose()
}

# Test ingredients for each image
$testCases = @(
    "Water, Wheat Starch, Soy Lecithin, Salt, Sugar",
    "Corn, Salt, Vegetable Oil, Preservative (E202), Color (Yellow 5)",
    "Wheat Flour, Water, Yeast, Salt, Sugar, Butter",
    "Milk, Yogurt Culture, Fruit Concentrate, Gelatin, Whey",
    "Potatoes, Vegetable Oil, Salt, Sodium Nitrate, Flavor Enhancer (MSG)",
    "Sugar, Cocoa, Milk Powder, Soy Lecithin, Vanilla Extract",
    "Flour, Sugar, Eggs, Butter, Baking Powder, Salt",
    "Cream, Milk, Sugar, Stabilizer (Guar Gum), Vanilla",
    "Tomato Concentrate, Vinegar, Sugar, Salt, Spices, Garlic",
    "Whey Protein, Peanut Butter, Oats, Sugar, Honey, Chocolate"
)

Write-Host "=== Creating Test Images ===" -ForegroundColor Green
Write-Host "Creating $($testCases.Count) test images..." -ForegroundColor Yellow

$imageFiles = @()
for ($i = 0; $i -lt $testCases.Count; $i++) {
    $filename = Join-Path $OutputDir "test-$($i+1).jpg"
    Write-Host "Creating image $($i+1)/$($testCases.Count): $filename" -ForegroundColor Cyan
    
    try {
        Create-TestImage -FilePath $filename -Label $testCases[$i]
        $imageFiles += @{
            path = $filename
            name = "Test Image $($i+1)"
            ingredients = $testCases[$i]
        }
        Write-Host "  OK: Created" -ForegroundColor Green
    }
    catch {
        Write-Host "  ERROR: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== FoodSafe Scanner API Tests ===" -ForegroundColor Green
Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow
Write-Host "Images to test: $($imageFiles.Count)" -ForegroundColor Yellow
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
        Write-Host "Error reading file: $_" -ForegroundColor Red
        return $null
    }
}

# Test results storage
$results = @()

# Run tests
for ($i = 0; $i -lt $imageFiles.Count; $i++) {
    $testFile = $imageFiles[$i]
    $testNum = $i + 1
    
    Write-Host "Test $testNum/$($imageFiles.Count): $($testFile.name)" -ForegroundColor Cyan
    Write-Host "  File: $($testFile.path)" -ForegroundColor Gray
    Write-Host "  Expected ingredients: $($testFile.ingredients)" -ForegroundColor Gray
    
    # Read image file
    Write-Host "  [1/3] Reading image..." -ForegroundColor Yellow
    $imageData = Get-FileAsBase64 -FilePath $testFile.path
    
    if ($null -eq $imageData) {
        Write-Host "  FAILED to read image" -ForegroundColor Red
        $results += @{
            test = $testNum
            name = $testFile.name
            status = "FAILED"
            error = "Could not read image file"
            extraction = $null
            analysis = $null
        }
        Write-Host ""
        continue
    }
    
    Write-Host "  OK: Read $($imageData.size) bytes" -ForegroundColor Green
    
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
            -TimeoutSec 60 `
            -ErrorAction Stop
        
        $extractData = $extractResponse.Content | ConvertFrom-Json
        
        if ($extractData.error) {
            Write-Host "  ERROR: $($extractData.error)" -ForegroundColor Red
            $results += @{
                test = $testNum
                name = $testFile.name
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
                Write-Host "    Sample: $ingredientStr" -ForegroundColor Gray
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
                        -TimeoutSec 90 `
                        -ErrorAction Stop
                    
                    $analysisData = $analysisResponse.Content | ConvertFrom-Json
                    
                    if ($analysisData.error) {
                        Write-Host "  ERROR: $($analysisData.error)" -ForegroundColor Red
                        $results += @{
                            test = $testNum
                            name = $testFile.name
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
                        
                        Write-Host "    Analyzed: $($analysisData.results.Count) ingredients" -ForegroundColor Gray
                        
                        $results += @{
                            test = $testNum
                            name = $testFile.name
                            status = "SUCCESS"
                            error = $null
                            extraction = $extractData
                            analysis = $analysisData
                        }
                    }
                }
                catch {
                    $errorMsg = $_.Exception.Message
                    Write-Host "  ERROR: Analysis failed: $errorMsg" -ForegroundColor Red
                    $results += @{
                        test = $testNum
                        name = $testFile.name
                        status = "PARTIAL"
                        error = "Analysis failed: $errorMsg"
                        extraction = $extractData
                        analysis = $null
                    }
                }
            }
            else {
                Write-Host "  SKIP: No ingredients to analyze" -ForegroundColor Yellow
                $results += @{
                    test = $testNum
                    name = $testFile.name
                    status = "PARTIAL"
                    error = "No ingredients extracted"
                    extraction = $extractData
                    analysis = $null
                }
            }
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        Write-Host "  ERROR: Extraction failed: $errorMsg" -ForegroundColor Red
        $results += @{
            test = $testNum
            name = $testFile.name
            status = "FAILED"
            error = "Extraction failed: $errorMsg"
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

Write-Host "Successful: $successCount / $($imageFiles.Count)" -ForegroundColor Green
Write-Host "Partial: $partialCount / $($imageFiles.Count)" -ForegroundColor Yellow
Write-Host "Failed: $failedCount / $($imageFiles.Count)" -ForegroundColor Red

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
        total = $imageFiles.Count
        successful = $successCount
        partial = $partialCount
        failed = $failedCount
    }
    tests = $results
}

$reportData | ConvertTo-Json -Depth 3 | Out-File -FilePath "test-results.json" -Encoding UTF8
Write-Host ""
Write-Host "Detailed report saved to: test-results.json" -ForegroundColor Green
