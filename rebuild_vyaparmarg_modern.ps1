$ErrorActionPreference = "Stop"
$office = "C:\Users\hp\AppData\Local\OfficeCLI\officecli.exe"
$output = "e:\IDEA-Lab\VyaparMarg\VyaparMarg_Modern_Presentation.pptx"
$appImage = "e:\IDEA-Lab\VyaparMarg\apps\mobile\design-concept.png"
$icon = "e:\IDEA-Lab\VyaparMarg\apps\mobile-native\assets\icon.png"

if (Test-Path $output) { Remove-Item -LiteralPath $output -Force }
& $office create $output
if ($LASTEXITCODE -ne 0) { throw "Could not create presentation" }

function Ocli { param([string[]]$CliArgs); & $office @CliArgs; if ($LASTEXITCODE -ne 0) { throw "OfficeCLI failed: $($CliArgs -join ' ')" } }
function Shape {
    param([int]$S,[string]$Text,[string]$X,[string]$Y,[string]$W,[string]$H,[string]$Size="18pt",[string]$Color="FFFFFF",[string]$Fill="none",[string]$Geom="rect",[string]$Align="left",[string]$Bold="false")
    Ocli @("add",$output,"/slide[$S]","--type","shape","--prop","text=$Text","--prop","x=$X","--prop","y=$Y","--prop","width=$W","--prop","height=$H","--prop","size=$Size","--prop","color=$Color","--prop","fill=$Fill","--prop","geometry=$Geom","--prop","align=$Align","--prop","bold=$Bold","--prop","margin=0.08in","--prop","line=none")
}
function Picture {
    param([int]$S,[string]$Src,[string]$X,[string]$Y,[string]$W,[string]$H,[string]$Alt)
    Ocli @("add",$output,"/slide[$S]","--type","picture","--prop","src=$Src","--prop","x=$X","--prop","y=$Y","--prop","width=$W","--prop","height=$H","--prop","alt=$Alt")
}
function Slide {
    param([string]$Title,[string]$Subtitle="")
    Ocli @("add",$output,"/","--type","slide","--prop","background=0B1220","--prop","transition=fade")
    $script:slide++
    Shape $slide $Title "0.65in" "0.45in" "8.1in" "0.55in" "27pt" "FFFFFF" "none" "rect" "left" "true"
    Shape $slide "" "0.65in" "1.08in" "1.0in" "0.08in" "8pt" "F97316" "F97316" "rect" "left" "false"
    if ($Subtitle) { Shape $slide $Subtitle "0.65in" "1.22in" "8.0in" "0.38in" "13pt" "A8B3C7" "none" "rect" "left" "false" }
}
function Card {
    param([int]$S,[string]$Heading,[string]$Body,[string]$X,[string]$Y,[string]$W,[string]$H,[string]$Accent="145DA0")
    Shape $S "" $X $Y $W $H "10pt" "FFFFFF" "162238" "roundRect" "left" "false"
    Shape $S $Heading $X "$([double]$Y.Replace('in','')+0.16)in" $W "0.32in" "16pt" $Accent "none" "rect" "left" "true"
    Shape $S $Body $X "$([double]$Y.Replace('in','')+0.53)in" $W "$([double]$H.Replace('in','')-0.62)in" "12pt" "D7DFEC" "none" "rect" "left" "false"
}
function Arrow { param([int]$S,[string]$X,[string]$Y); Shape $S ">" $X $Y "0.42in" "0.42in" "22pt" "F97316" "none" "rightArrow" "center" "true" }

$slide = 0

# 1 Cover
Slide "VyaparMarg" "Rural business assistance, redesigned for the way micro-entrepreneurs actually work."
Shape 1 "A trusted digital companion for rural entrepreneurs" "0.65in" "1.85in" "5.4in" "0.8in" "25pt" "FFFFFF" "none" "rect" "left" "true"
Shape 1 "Multilingual assistant  •  Explainable recommendations  •  Guided applications" "0.65in" "2.9in" "5.9in" "0.5in" "15pt" "A8B3C7" "none" "rect" "left" "false"
Picture 1 $appImage "6.85in" "1.45in" "2.05in" "4.65in" "VyaparMarg mobile application dashboard"
Shape 1 "IDEA LAB-III  |  Department of Computer Engineering" "0.65in" "6.55in" "5.4in" "0.3in" "11pt" "A8B3C7" "none" "rect" "left" "false"
Shape 1 "Rangesh Gupta  |  Roll No. 53  |  SE CPMN A" "0.65in" "6.88in" "5.4in" "0.3in" "13pt" "F97316" "none" "rect" "left" "true"

# 2 Why
Slide "The opportunity" "Small businesses do not need more links. They need the right next step."
Card 2 "01  Discover" "Scheme information is scattered across portals, PDFs and offices." "0.65in" "1.8in" "2.55in" "2.0in" "145DA0"
Card 2 "02  Understand" "Eligibility language and process steps are difficult to interpret." "3.45in" "1.8in" "2.55in" "2.0in" "F97316"
Card 2 "03  Act" "Users need a guided application journey, not just a recommendation." "6.25in" "1.8in" "2.55in" "2.0in" "7C3AED"
Shape 2 "Core challenge" "0.65in" "4.55in" "1.55in" "0.35in" "13pt" "F97316" "none" "rect" "left" "true"
Shape 2 "Turn a voice question into a trustworthy, actionable business decision." "0.65in" "4.95in" "8.0in" "0.7in" "24pt" "FFFFFF" "none" "rect" "left" "true"

# 3 Product
Slide "The product" "One mobile-first experience from question to application plan."
Picture 3 $appImage "0.75in" "1.65in" "2.55in" "5.05in" "VyaparMarg mobile assistant screen"
Card 3 "Ask naturally" "Marathi, Hindi, Hinglish or English voice and text." "3.8in" "1.7in" "4.8in" "1.15in" "145DA0"
Card 3 "Build context" "Business profile captures type, location, turnover and goals." "3.8in" "3.1in" "4.8in" "1.15in" "F97316"
Card 3 "Get clarity" "Recommendations show reasons, score and missing requirements." "3.8in" "4.5in" "4.8in" "1.15in" "138A5E"
Shape 3 "The interface feels like a helpful local guide - not a government form." "3.8in" "6.05in" "4.8in" "0.55in" "15pt" "D7DFEC" "none" "rect" "left" "false"

# 4 Workflow
Slide "How it works" "A simple four-step journey with a rules-backed decision layer."
Shape 4 "1  ASK" "0.7in" "2.05in" "1.65in" "0.68in" "16pt" "FFFFFF" "145DA0" "roundRect" "center" "true"
Arrow 4 "2.48in" "2.2in"
Shape 4 "2  PROFILE" "2.95in" "2.05in" "1.65in" "0.68in" "16pt" "FFFFFF" "145DA0" "roundRect" "center" "true"
Arrow 4 "4.73in" "2.2in"
Shape 4 "3  MATCH" "5.2in" "2.05in" "1.65in" "0.68in" "16pt" "FFFFFF" "F97316" "roundRect" "center" "true"
Arrow 4 "6.98in" "2.2in"
Shape 4 "4  APPLY" "7.45in" "2.05in" "1.2in" "0.68in" "16pt" "FFFFFF" "138A5E" "roundRect" "center" "true"
Shape 4 "Voice/text input" "0.72in" "3.35in" "1.6in" "0.45in" "12pt" "A8B3C7" "none" "rect" "center" "false"
Shape 4 "Structured profile" "2.92in" "3.35in" "1.7in" "0.45in" "12pt" "A8B3C7" "none" "rect" "center" "false"
Shape 4 "Deterministic rules" "5.12in" "3.35in" "1.8in" "0.45in" "12pt" "A8B3C7" "none" "rect" "center" "false"
Shape 4 "Portal steps + progress" "7.25in" "3.35in" "1.55in" "0.45in" "12pt" "A8B3C7" "none" "rect" "center" "false"
Shape 4 "AI explains. Structured data and rules decide." "1.8in" "5.2in" "6.3in" "0.65in" "22pt" "FFFFFF" "162238" "roundRect" "center" "true"

# 5 Architecture
Slide "Product architecture" "Clear boundaries keep the experience helpful, secure and testable."
Card 5 "Mobile app" "Expo / React Native UI for assistant, profile and applications." "0.7in" "1.7in" "2.45in" "1.65in" "145DA0"
Arrow 5 "3.27in" "2.22in"
Card 5 "FastAPI" "Authenticated REST contract under /api/v1." "3.75in" "1.7in" "2.45in" "1.65in" "F97316"
Arrow 5 "6.32in" "2.22in"
Card 5 "Decision layer" "Verified schemes, requirements, rules and recommendations." "6.8in" "1.7in" "2.45in" "1.65in" "138A5E"
Card 5 "Supabase Auth + Postgres + RLS" "User-owned profiles, conversations, recommendations, applications and document metadata." "1.15in" "4.35in" "3.25in" "1.25in" "7C3AED"
Card 5 "Explainable response" "Score, reasons, eligibility status and missing information return to the user." "5.55in" "4.35in" "3.25in" "1.25in" "F97316"

# 6 Differentiation
Slide "What makes it different" "Designed around trust, inclusion and action."
Card 6 "Local-language by default" "The user can ask in the language they think in." "0.7in" "1.7in" "3.8in" "1.35in" "145DA0"
Card 6 "Explainable recommendations" "Every match comes with a reason - and a clear gap to fix." "4.8in" "1.7in" "3.8in" "1.35in" "F97316"
Card 6 "Rules-backed decisions" "The LLM explains; deterministic rules evaluate eligibility." "0.7in" "3.45in" "3.8in" "1.35in" "138A5E"
Card 6 "Application continuity" "The user does not lose momentum between discovery and portal action." "4.8in" "3.45in" "3.8in" "1.35in" "7C3AED"
Shape 6 "Better access is not only better UX - it is better decision support." "1.1in" "5.55in" "7.2in" "0.58in" "17pt" "FFFFFF" "162238" "roundRect" "center" "true"

# 7 Requirements
Slide "Technical foundation" "A practical first slice built for reliability."
Card 7 "Frontend" "Expo / React Native`nMobile-first screens`nVoice + text interaction" "0.7in" "1.65in" "2.55in" "2.0in" "145DA0"
Card 7 "Backend" "FastAPI`nAuthenticated endpoints`nExplicit error format" "3.45in" "1.65in" "2.55in" "2.0in" "F97316"
Card 7 "Data" "Supabase Auth`nPostgres + RLS`nStorage metadata" "6.2in" "1.65in" "2.55in" "2.0in" "138A5E"
Shape 7 "Quality bar: explicit errors, testable contracts, server-side service credentials and no secret keys in client apps." "0.9in" "4.6in" "7.7in" "0.9in" "18pt" "FFFFFF" "162238" "roundRect" "center" "true"

# 8 Future
Slide "Roadmap" "Start with clarity. Scale with evidence."
Shape 8 "NOW" "0.8in" "2.0in" "1.3in" "0.56in" "16pt" "FFFFFF" "145DA0" "roundRect" "center" "true"
Arrow 8 "2.22in" "2.08in"
Shape 8 "NEXT" "2.7in" "2.0in" "1.3in" "0.56in" "16pt" "FFFFFF" "F97316" "roundRect" "center" "true"
Arrow 8 "4.12in" "2.08in"
Shape 8 "SCALE" "4.6in" "2.0in" "1.3in" "0.56in" "16pt" "FFFFFF" "138A5E" "roundRect" "center" "true"
Arrow 8 "6.02in" "2.08in"
Shape 8 "IMPACT" "6.5in" "2.0in" "1.3in" "0.56in" "16pt" "FFFFFF" "7C3AED" "roundRect" "center" "true"
Shape 8 "Core vertical slice" "0.68in" "3.1in" "1.55in" "0.45in" "12pt" "D7DFEC" "none" "rect" "center" "false"
Shape 8 "Offline + documents" "2.48in" "3.1in" "1.75in" "0.45in" "12pt" "D7DFEC" "none" "rect" "center" "false"
Shape 8 "More schemes + dialects" "4.34in" "3.1in" "1.85in" "0.45in" "12pt" "D7DFEC" "none" "rect" "center" "false"
Shape 8 "Outcomes + partnerships" "6.35in" "3.1in" "1.75in" "0.45in" "12pt" "D7DFEC" "none" "rect" "center" "false"

# 9 Team
Slide "Team & contributions" "Replace the placeholders with each teammate's name, role and screenshot."
Picture 9 $icon "0.75in" "1.65in" "0.75in" "0.75in" "VyaparMarg app icon"
Shape 9 "Rangesh Gupta" "1.7in" "1.55in" "3.0in" "0.4in" "21pt" "FFFFFF" "none" "rect" "left" "true"
Shape 9 "Roll No. 53  |  SE CPMN A`nProduct concept, mobile UX and project integration" "1.7in" "2.05in" "3.3in" "0.8in" "14pt" "D7DFEC" "none" "rect" "left" "false"
Card 9 "Team member 2" "Name / roll no.`nRole / contribution`nAdd project screenshot" "0.75in" "3.45in" "2.45in" "1.7in" "F97316"
Card 9 "Team member 3" "Name / roll no.`nRole / contribution`nAdd project screenshot" "3.55in" "3.45in" "2.45in" "1.7in" "145DA0"
Card 9 "Team member 4" "Name / roll no.`nRole / contribution`nAdd project screenshot" "6.35in" "3.45in" "2.45in" "1.7in" "138A5E"

# 10 Close
Slide "Thank you" "VyaparMarg - making the next business step easier to see."
Shape 10 "Questions?" "2.1in" "2.15in" "5.2in" "0.85in" "32pt" "FFFFFF" "145DA0" "roundRect" "center" "true"
Shape 10 "Rangesh Gupta  |  Roll No. 53  |  SE CPMN A" "2.0in" "3.55in" "5.4in" "0.4in" "14pt" "A8B3C7" "none" "rect" "center" "false"

Ocli @("view",$output,"stats")
Ocli @("view",$output,"text","--max-lines","250")
