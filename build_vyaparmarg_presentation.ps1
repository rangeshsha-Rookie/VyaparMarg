$ErrorActionPreference = "Stop"

$office = "C:\Users\hp\AppData\Local\OfficeCLI\officecli.exe"
$source = "e:\Downlaod ME\IDEA_Lab_Literature_Review_Updated.pptx"
$output = "e:\IDEA-Lab\VyaparMarg\VyaparMarg_Project_Presentation.pptx"
$appImage = "e:\IDEA-Lab\VyaparMarg\apps\mobile\design-concept.png"
$icon = "e:\IDEA-Lab\VyaparMarg\apps\mobile-native\assets\icon.png"

Copy-Item -LiteralPath $source -Destination $output -Force

function Ocli {
    param([string[]]$Arguments)
    & $office @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "OfficeCLI failed: $($Arguments -join ' ')"
    }
}

function Set-NodeText {
    param([string]$Path, [string]$Text)
    Ocli @("set", $output, $Path, "--prop", "text=$Text")
}

function Add-Text {
    param(
        [int]$Slide,
        [string]$Text,
        [string]$X = "0.7in",
        [string]$Y = "1.5in",
        [string]$W = "5.8in",
        [string]$H = "1.0in",
        [string]$Size = "18pt",
        [string]$Color = "172B4D",
        [string]$Fill = "none",
        [string]$Geometry = "rect",
        [string]$Align = "left",
        [string]$Bold = "false"
    )
    Ocli @(
        "add", $output, "/slide[$Slide]", "--type", "shape",
        "--prop", "text=$Text",
        "--prop", "x=$X", "--prop", "y=$Y", "--prop", "width=$W", "--prop", "height=$H",
        "--prop", "size=$Size", "--prop", "color=$Color", "--prop", "fill=$Fill",
        "--prop", "geometry=$Geometry", "--prop", "align=$Align", "--prop", "bold=$Bold",
        "--prop", "margin=0.08in", "--prop", "line=none"
    )
}

function Add-Picture {
    param(
        [int]$Slide,
        [string]$Source,
        [string]$X,
        [string]$Y,
        [string]$W,
        [string]$H,
        [string]$Alt
    )
    Ocli @(
        "add", $output, "/slide[$Slide]", "--type", "picture",
        "--prop", "src=$Source", "--prop", "x=$X", "--prop", "y=$Y",
        "--prop", "width=$W", "--prop", "height=$H", "--prop", "alt=$Alt"
    )
}

function Add-Card {
    param(
        [int]$Slide,
        [string]$Title,
        [string]$Body,
        [string]$X,
        [string]$Y,
        [string]$W = "3.75in",
        [string]$H = "1.25in",
        [string]$Fill = "EEF5FF",
        [string]$Accent = "145DA0"
    )
    Add-Text $Slide $Title $X $Y $W "0.32in" "17pt" $Accent $Fill "roundRect" "left" "true"
    $yValue = [double]($Y.Replace("in", ""))
    $hValue = [double]($H.Replace("in", ""))
    $bodyY = "{0}in" -f ($yValue + 0.34)
    $bodyH = "{0}in" -f ($hValue - 0.38)
    Add-Text $Slide $Body $X $bodyY $W $bodyH "12pt" "344563" "none" "rect" "left" "false"
}

function Add-Arrow {
    param([int]$Slide, [string]$X, [string]$Y, [string]$W = "0.55in", [string]$H = "0.35in")
    Add-Text $Slide ">" $X $Y $W $H "24pt" "F97316" "none" "rightArrow" "center" "true"
}

# Cover and agenda
Set-NodeText "/slide[1]/shape[@id=55]" "Department of Computer Engineering`n(Academic Year: 2026-27)"
Set-NodeText "/slide[1]/shape[@id=56]" "IDEA LAB-III`n(Innovation Design Engineering and Apply)  |  Course code: 12812310`n`nTheme`nVyaparMarg: A Rural Business Assistant for Micro-Entrepreneurs`n`nPresented by: Rangesh Gupta`nRoll No: 53  |  SE CPMN A"
Set-NodeText "/slide[2]/shape[@id=65]" "Presentation roadmap"
Set-NodeText "/slide[2]/shape[@id=68]" "1. Problem statement`n2. Problem definition`n3. Abstract and introduction`n4. Literature review`n5. Existing system`n6. Proposed solution and workflow`n7. Objectives and technical requirements`n8. Future scope`n9. Team members and contributions`n10. Conclusion"

# Titles
$titles = @{
    3 = @("73", "Problem statement")
    4 = @("78", "Problem definition")
    5 = @("83", "Abstract")
    6 = @("88", "Introduction")
    7 = @("93", "Literature review")
    8 = @("99", "Existing system")
    9 = @("104", "Proposed solution")
    10 = @("109", "Objectives")
    11 = @("114", "Technical requirements")
    12 = @("119", "Future scope")
    13 = @("124", "Team members & contributions")
}
foreach ($entry in $titles.GetEnumerator()) {
    Set-NodeText "/slide[$($entry.Key)]/shape[@id=$($entry.Value[0])]" $entry.Value[1]
}

# Slide 3: problem statement
Add-Card 3 "Fragmented information" "Government schemes, eligibility rules and portals are difficult to discover in one place." "0.7in" "1.55in" "3.8in" "1.25in" "FFF4E8" "F97316"
Add-Card 3 "Language barrier" "Many micro-entrepreneurs prefer Marathi, Hindi or Hinglish over English-first digital journeys." "4.85in" "1.55in" "3.8in" "1.25in" "EEF5FF" "145DA0"
Add-Card 3 "Unclear next steps" "Users need explainable recommendations and assisted applications, not just a list of links." "2.78in" "3.05in" "3.8in" "1.25in" "ECFDF3" "138A5E"
Add-Text 3 "Core challenge: turn a voice question into a trustworthy, actionable business decision." "1.35in" "5.05in" "7.25in" "0.7in" "20pt" "0F2747" "FFF7ED" "roundRect" "center" "true"

# Slide 4: problem definition + workflow
Add-Text 4 "For a rural micro-entrepreneur, finding the right scheme currently means switching between search engines, PDFs, offices and portals." "0.75in" "1.35in" "7.2in" "0.7in" "17pt" "172B4D" "none" "rect" "left" "false"
Add-Text 4 "Need" "0.75in" "2.55in" "1.3in" "0.6in" "18pt" "FFFFFF" "145DA0" "roundRect" "center" "true"
Add-Arrow 4 "2.05in" "2.68in"
Add-Text 4 "Understand" "2.7in" "2.55in" "1.45in" "0.6in" "18pt" "FFFFFF" "F97316" "roundRect" "center" "true"
Add-Arrow 4 "4.16in" "2.68in"
Add-Text 4 "Validate" "4.8in" "2.55in" "1.35in" "0.6in" "18pt" "FFFFFF" "138A5E" "roundRect" "center" "true"
Add-Arrow 4 "6.1in" "2.68in"
Add-Text 4 "Apply" "6.72in" "2.55in" "1.2in" "0.6in" "18pt" "FFFFFF" "7C3AED" "roundRect" "center" "true"
Add-Text 4 "VyaparMarg connects these steps through one assistant-led, explainable journey." "1.25in" "4.2in" "7.25in" "0.7in" "20pt" "0F2747" "E8F1FF" "roundRect" "center" "true"

# Slide 5: abstract + application image
Add-Text 5 "VyaparMarg is a mobile-first rural business assistant that combines multilingual conversation, structured business profiles and deterministic scheme rules. It recommends relevant programmes, explains why they match, identifies missing information and guides the user through an application plan." "0.7in" "1.45in" "4.15in" "2.8in" "16pt" "172B4D" "F8FAFC" "roundRect" "left" "false"
Add-Picture 5 $appImage "5.25in" "1.2in" "2.55in" "4.95in" "VyaparMarg mobile assistant dashboard concept"
Add-Text 5 "Application image: mobile assistant dashboard" "5.1in" "6.25in" "3.0in" "0.4in" "11pt" "64748B" "none" "rect" "center" "false"

# Slide 6: introduction
Add-Card 6 "Voice-first access" "Ask in Marathi, Hindi, Hinglish or English." "0.7in" "1.4in" "3.7in" "1.25in" "EEF5FF" "145DA0"
Add-Card 6 "Profile-aware" "Recommendations use business type, location and scale." "4.85in" "1.4in" "3.7in" "1.25in" "FFF4E8" "F97316"
Add-Card 6 "Explainable" "Every recommendation includes reasons and missing requirements." "0.7in" "3.05in" "3.7in" "1.25in" "ECFDF3" "138A5E"
Add-Card 6 "Actionable" "Move from discovery to a planned application with progress." "4.85in" "3.05in" "3.7in" "1.25in" "F5F3FF" "7C3AED"
Add-Text 6 "Design principle: AI explains; structured data and deterministic rules decide eligibility." "1.0in" "5.25in" "7.55in" "0.65in" "18pt" "0F2747" "FFF7ED" "roundRect" "center" "true"

# Slide 8: existing system
Add-Text 8 "Current journey" "0.7in" "1.35in" "2.5in" "0.45in" "18pt" "145DA0" "none" "rect" "left" "true"
Add-Text 8 "Search web" "0.7in" "2.0in" "1.45in" "0.6in" "15pt" "FFFFFF" "145DA0" "roundRect" "center" "true"
Add-Arrow 8 "2.2in" "2.12in"
Add-Text 8 "Read PDFs" "2.85in" "2.0in" "1.45in" "0.6in" "15pt" "FFFFFF" "F97316" "roundRect" "center" "true"
Add-Arrow 8 "4.35in" "2.12in"
Add-Text 8 "Visit office" "5.0in" "2.0in" "1.45in" "0.6in" "15pt" "FFFFFF" "7C3AED" "roundRect" "center" "true"
Add-Arrow 8 "6.5in" "2.12in"
Add-Text 8 "Portal form" "7.1in" "2.0in" "1.25in" "0.6in" "15pt" "FFFFFF" "138A5E" "roundRect" "center" "true"
Add-Card 8 "Pain point 1" "Information is scattered across portals and documents." "0.7in" "3.45in" "2.55in" "1.35in" "FFF4E8" "F97316"
Add-Card 8 "Pain point 2" "Eligibility logic is hard to interpret without support." "3.45in" "3.45in" "2.55in" "1.35in" "EEF5FF" "145DA0"
Add-Card 8 "Pain point 3" "Digital confidence and language needs are overlooked." "6.2in" "3.45in" "2.55in" "1.35in" "ECFDF3" "138A5E"

# Slide 9: proposed architecture and workflow
Add-Text 9 "One connected flow from conversation to action" "0.7in" "1.25in" "7.5in" "0.45in" "18pt" "172B4D" "none" "rect" "center" "true"
Add-Text 9 "Mobile app" "0.55in" "2.1in" "1.45in" "0.7in" "15pt" "FFFFFF" "145DA0" "roundRect" "center" "true"
Add-Arrow 9 "2.05in" "2.27in"
Add-Text 9 "FastAPI" "2.65in" "2.1in" "1.35in" "0.7in" "15pt" "FFFFFF" "F97316" "roundRect" "center" "true"
Add-Arrow 9 "4.0in" "2.27in"
Add-Text 9 "Assistant" "4.55in" "2.1in" "1.35in" "0.7in" "15pt" "FFFFFF" "7C3AED" "roundRect" "center" "true"
Add-Arrow 9 "5.9in" "2.27in"
Add-Text 9 "Rules engine" "6.45in" "2.1in" "1.55in" "0.7in" "15pt" "FFFFFF" "138A5E" "roundRect" "center" "true"
Add-Text 9 "Profile + language" "0.6in" "3.55in" "1.8in" "0.65in" "14pt" "172B4D" "E8F1FF" "roundRect" "center" "true"
Add-Text 9 "Verified schemes" "2.8in" "3.55in" "1.8in" "0.65in" "14pt" "172B4D" "FFF7ED" "roundRect" "center" "true"
Add-Text 9 "Reasons + missing data" "5.0in" "3.55in" "2.05in" "0.65in" "14pt" "172B4D" "ECFDF3" "roundRect" "center" "true"
Add-Text 9 "Application plan" "3.1in" "5.0in" "2.1in" "0.65in" "15pt" "FFFFFF" "0F2747" "roundRect" "center" "true"
Add-Arrow 9 "3.88in" "4.28in" "0.55in" "0.55in"

# Slide 10: objectives
Add-Card 10 "01  Discover" "Make relevant rural schemes easy to find." "0.7in" "1.35in" "3.7in" "1.15in" "EEF5FF" "145DA0"
Add-Card 10 "02  Understand" "Explain eligibility in clear local-language responses." "4.85in" "1.35in" "3.7in" "1.15in" "FFF4E8" "F97316"
Add-Card 10 "03  Validate" "Use structured rules for consistent, auditable results." "0.7in" "2.9in" "3.7in" "1.15in" "ECFDF3" "138A5E"
Add-Card 10 "04  Apply" "Track portal steps and application progress." "4.85in" "2.9in" "3.7in" "1.15in" "F5F3FF" "7C3AED"
Add-Card 10 "05  Include" "Design for low bandwidth, multilingual and mobile-first use." "2.78in" "4.45in" "3.7in" "1.15in" "FFF7ED" "C2410C"

# Slide 11: technical requirements
Add-Card 11 "Frontend" "Expo / React Native mobile app, multilingual assistant UI, profile and applications views." "0.7in" "1.35in" "3.8in" "1.35in" "EEF5FF" "145DA0"
Add-Card 11 "Backend" "FastAPI REST API under /api/v1 for profiles, assistant messages, schemes and applications." "4.85in" "1.35in" "3.8in" "1.35in" "FFF4E8" "F97316"
Add-Card 11 "Data & security" "Supabase Auth, Postgres, RLS, Storage metadata and server-side service credentials." "0.7in" "3.15in" "3.8in" "1.35in" "ECFDF3" "138A5E"
Add-Card 11 "Decision layer" "LLM extracts and explains; deterministic scheme rules produce eligibility status." "4.85in" "3.15in" "3.8in" "1.35in" "F5F3FF" "7C3AED"
Add-Text 11 "Quality bar: trustworthy recommendations, explicit errors, testable contracts and no service-role key in client apps." "0.95in" "5.35in" "7.4in" "0.65in" "16pt" "0F2747" "FFF7ED" "roundRect" "center" "true"

# Slide 12: future scope
Add-Card 12 "Phase 2" "Offline-friendly flows, document capture and stronger voice interaction." "0.7in" "1.45in" "3.8in" "1.3in" "EEF5FF" "145DA0"
Add-Card 12 "Phase 3" "More state schemes, dialect coverage and local support networks." "4.85in" "1.45in" "3.8in" "1.3in" "FFF4E8" "F97316"
Add-Card 12 "Phase 4" "Outcome tracking, reminders and assisted portal completion." "0.7in" "3.25in" "3.8in" "1.3in" "ECFDF3" "138A5E"
Add-Card 12 "Long term" "Extension support, analytics dashboards and ecosystem partnerships." "4.85in" "3.25in" "3.8in" "1.3in" "F5F3FF" "7C3AED"
Add-Text 12 "Scale with evidence: learn from verified outcomes while keeping decisions explainable." "1.15in" "5.35in" "7.0in" "0.65in" "18pt" "0F2747" "FFF7ED" "roundRect" "center" "true"

# Slide 13: team
Add-Picture 13 $icon "0.75in" "1.35in" "0.9in" "0.9in" "VyaparMarg app icon"
Add-Text 13 "Rangesh Gupta" "1.85in" "1.35in" "2.9in" "0.4in" "20pt" "145DA0" "none" "rect" "left" "true"
Add-Text 13 "Roll No. 53  |  SE CPMN A`nProject: VyaparMarg`nFocus: product concept, mobile UX and project integration" "1.85in" "1.82in" "3.2in" "1.0in" "14pt" "344563" "none" "rect" "left" "false"
Add-Text 13 "Other team members - add name, roll no., role and project screenshot here" "5.15in" "1.35in" "3.55in" "0.85in" "17pt" "FFFFFF" "F97316" "roundRect" "center" "true"
Add-Text 13 "Member 2`nName / Roll No.`nContribution / screenshot" "0.75in" "3.35in" "2.35in" "1.5in" "15pt" "64748B" "F8FAFC" "roundRect" "center" "false"
Add-Text 13 "Member 3`nName / Roll No.`nContribution / screenshot" "3.55in" "3.35in" "2.35in" "1.5in" "15pt" "64748B" "F8FAFC" "roundRect" "center" "false"
Add-Text 13 "Member 4`nName / Roll No.`nContribution / screenshot" "6.35in" "3.35in" "2.35in" "1.5in" "15pt" "64748B" "F8FAFC" "roundRect" "center" "false"
Add-Text 13 "Replace each placeholder card with the teammate's project screenshot when available." "1.0in" "5.55in" "7.45in" "0.55in" "14pt" "64748B" "none" "rect" "center" "false"

# Closing slide
Set-NodeText "/slide[14]/shape[@id=130]" "VyaparMarg"
Set-NodeText "/slide[14]/shape[@id=131]" "Thank you"
Add-Text 14 "Questions?" "2.8in" "2.2in" "3.6in" "0.85in" "30pt" "FFFFFF" "145DA0" "roundRect" "center" "true"
Add-Text 14 "A trusted digital companion for rural entrepreneurs" "2.0in" "3.35in" "5.2in" "0.55in" "18pt" "172B4D" "none" "rect" "center" "false"

Ocli @("validate", $output)
Ocli @("view", $output, "stats")
