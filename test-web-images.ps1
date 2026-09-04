# FoodSafe Scanner - Web Images Test
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
        name = "Coca-Cola Nutrition Label"
        url = "https://cdn.shopify.com/s/files/1/0565/0223/9556/files/coca-cola-nutrition-facts.jpg?v=1614556800"
        description = "Classic beverage nutrition label"
    },
    @{
        name = "Cereal Box Nutrition"
        url = "https://www.nutritionix.com/images/items/nix_item_51282.jpg"
        description = "Breakfast cereal ingredients"
    },
    @{
        name = "Bread Package Label"
        url = "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=500&fit=crop"
        description = "Whole wheat bread label"
    },
    @{
        name = "Yogurt Container"
        url = "https://images.unsplash.com/photo-1488477304112-4bae1a6978f9?w=500&h=500&fit=crop"
        description = "Greek yogurt nutrition facts"
    },
    @{
        name = "Snack Chips Bag"
        url = "https://images.unsplash.com/photo-1585070526059-41b3d63e4220?w=500&h=500&fit=crop"
        description = "Potato chip packaging"
    },
    @{
        name = "Peanut Butter Jar"
        url = "https://images.unsplash.com/photo-1599599810694-b5ac4dd4e4a6?w=500&h=500&fit=crop"
        description = "Peanut butter label"
    },
    @{
        name = "Chocolate Bar"
        url = "https://images.unsplash.com/photo-1599599810694-b5ac4dd4e4a6?w=500&h=500&fit=crop"
        description = "Chocolate product packaging"
    },
    @{
        name = "Frozen Pizza Box"
        url = "https://images.unsplash.com/photo-1604068549290-daea0aa2d83e?w=500&h=500&fit=crop"
        description = "Frozen pizza nutrition label"
    },
    @{
        name = "Protein Bar"
        url = "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&h=500&fit=crop"
        description = "Protein bar nutrition facts"
    },
    @{
        name = "Tomato Sauce Can"
        url = "https://images.unsplash.com/photo-1585518419759-f069b277b933?w=500&h=500&fit=crop"
        description = "Canned tomato sauce label"
    }
)

Write-Host "=== FoodSafe Scanner - Web Images Test ===" -ForegroundColor Green
Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow
Write-Host "Total images to download: $($testImages.Count)" -ForegroundColor Yellow
Write-Host ""

# Function to download image with retry logic
function Download-ImageFile {
    param(
        [string]$Url,
        [string]$OutputPath,
        [int]$RetryCount = 3
    )
    
    for ($attempt = 1; $attempt -le $RetryCount; $attempt++) {
        try {
            $ProgressPreference = 'SilentlyContinue'
            Invoke-WebRequest -Uri $Url -OutFile $OutputPath -TimeoutSec 15 -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -ErrorAction Stop
            return $true
        }
        catch {
            if ($attempt -lt $RetryCount) {
                Write-Host "    Retry $attempt/$RetryCount..." -ForegroundColor Gray
                Start-Sleep -Seconds 2
            }
        }
    }
    return $false
}

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
$downloadedCount = 0

# Download images
Write-Host "=== Downloading Images ===" -ForegroundColor Green
for ($i = 0; $i -lt $testImages.Count; $i++) {
    $test = $testImages[$i]
    $outputFile = Join-Path $OutputDir "image-$($i+1).jpg"
    
    Write-Host "[$($i+1)/$($testImages.Count)] Downloading: $($test.name)" -ForegroundColor Cyan
    
    if (Download-ImageFile -Url $test.url -OutputPath $outputFile) {
        $fileSize = (Get-Item $outputFile).Length
        Write-Host "  OK: Downloaded $fileSize bytes" -ForegroundColor Green
        $downloadedCount++
    }
    else {
        Write-Host "  ERROR: Could not download" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Downloaded: $downloadedCount / $($testImages.Count) images" -ForegroundColor Yellow
Write-Host ""

if ($downloadedCount -eq 0) {
    Write-Host "ERROR: No images were downloaded. Cannot continue." -ForegroundColor Red
    exit 1
}

# Run API tests
Write-Host "=== Testing API with Downloaded Images ===" -ForegroundColor Green
Write-Host ""

# Get list of downloaded images
$imageFiles = Get-ChildItem -Path $OutputDir -Filter "*.jpg" | Sort-Object Name

Write-Host "Testing $($imageFiles.Count) images..." -ForegroundColor Yellow
Write-Host ""

$testNum = 0
foreach ($imageFile in $imageFiles) {
    $testNum++
    $filename = $imageFile.Name
    
    Write-Host "Test $testNum/$($imageFiles.Count): $filename" -ForegroundColor Cyan
    Write-Host "  File size: $($imageFile.Length) bytes" -ForegroundColor Gray
    
    # Convert to base64
    Write-Host "  [1/3] Reading image..." -ForegroundColor Yellow
    $imageData = Get-FileAsBase64 -FilePath $imageFile.FullName
    
    if ($null -eq $imageData) {
        Write-Host "  ERROR: Could not read image" -ForegroundColor Red
        $results += @{
            test = $testNum
            name = $filename
            status = "FAILED"
            error = "Could not read image file"
        }
        Write-Host ""
        continue
    }
    
    # Call extract-ingredients API
    Write-Host "  [2/3] Extracting ingredients..." -ForegroundColor Yellow
    try {
        $requestBody = @{
            imageBase64 = $imageData.base64
            imageMediaType = $imageData.mimeType
        } | ConvertTo-Json -Compress
        
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $extractResponse = Invoke-WebRequest -Uri "$BaseUrl/api/extract-ingredients" `
            -Method POST `
            -ContentType "application/json" `
            -Body $requestBody `
            -TimeoutSec 120 `
            -ErrorAction Stop
        $sw.Stop()
        
        $extractData = $extractResponse.Content | ConvertFrom-Json
        
        Write-Host "  OK: Response in $($sw.ElapsedMilliseconds)ms" -ForegroundColor Green
        
        if ($extractData.error) {
            Write-Host "  ERROR: $($extractData.error)" -ForegroundColor Red
            $results += @{
                test = $testNum
                name = $filename
                status = "FAILED"
                error = $extractData.error
                ingredients = @()
            }
        }
        elseif ($extractData.ingredients.Count -eq 0) {
            Write-Host "  WARNING: No ingredients extracted from image" -ForegroundColor Yellow
            Write-Host "  Confidence: $($extractData.confidence)" -ForegroundColor Gray
            Write-Host "  Language: $($extractData.language_detected)" -ForegroundColor Gray
            
            $results += @{
                test = $testNum
                name = $filename
                status = "PARTIAL"
                error = "No ingredients in image"
                ingredients = @()
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
            Write-Host "    Ingredients: $ingredientStr..." -ForegroundColor Gray
            
            # Call analyze-ingredients API
            Write-Host "  [3/3] Analyzing ingredients..." -ForegroundColor Yellow
            try {
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
                    -ErrorAction Stop
                $sw2.Stop()
                
                $analysisData = $analysisResponse.Content | ConvertFrom-Json
                
                Write-Host "  OK: Analysis in $($sw2.ElapsedMilliseconds)ms" -ForegroundColor Green
                
                if ($analysisData.error) {
                    Write-Host "  ERROR: $($analysisData.error)" -ForegroundColor Red
                    $results += @{
                        test = $testNum
                        name = $filename
                        status = "PARTIAL"
                        error = $analysisData.error
                        ingredients = $extractData.ingredients.Count
                        riskScore = "N/A"
                    }
                }
                else {
                    Write-Host "    Risk Score: $($analysisData.product_risk_score)" -ForegroundColor Green
                    Write-Host "    Results Analyzed: $($analysisData.results.Count)" -ForegroundColor Gray
                    
                    if ($analysisData.top_concerns -and $analysisData.top_concerns.Count -gt 0) {
                        $concerns = $analysisData.top_concerns -join ', '
                        Write-Host "    Top Concerns: $concerns" -ForegroundColor Yellow
                    }
                    
                    $results += @{
                        test = $testNum
                        name = $filename
                        status = "SUCCESS"
                        ingredients = $extractData.ingredients.Count
                        riskScore = $analysisData.product_risk_score
                        topConcerns = $analysisData.top_concerns
                        extractTime = $sw.ElapsedMilliseconds
                        analysisTime = $sw2.ElapsedMilliseconds
                    }
                }
            }
            catch {
                $errorMsg = $_.Exception.Message
                Write-Host "  ERROR: Analysis failed - $errorMsg" -ForegroundColor Red
                $results += @{
                    test = $testNum
                    name = $filename
                    status = "PARTIAL"
                    error = "Analysis API failed"
                    ingredients = $extractData.ingredients.Count
                }
            }
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        Write-Host "  ERROR: Extraction failed - $errorMsg" -ForegroundColor Red
        $results += @{
            test = $testNum
            name = $filename
            status = "FAILED"
            error = $errorMsg
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
    if ($_.riskScore -and $_.riskScore -ne "N/A") {
        Write-Host "  Risk Score: $($_.riskScore)" -ForegroundColor Gray
    }
    if ($_.topConcerns) {
        Write-Host "  Concerns: $($_.topConcerns -join ', ')" -ForegroundColor Yellow
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
        successRate = "$([Math]::Round(($successCount / $results.Count) * 100))%"
    }
    tests = $results
}

$reportData | ConvertTo-Json -Depth 3 | Out-File -FilePath "web-test-results.json" -Encoding UTF8
Write-Host ""
Write-Host "Results saved to: web-test-results.json" -ForegroundColor Green
Write-Host "Images saved to: $OutputDir" -ForegroundColor Green
