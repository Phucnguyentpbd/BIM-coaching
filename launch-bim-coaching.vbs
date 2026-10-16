Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Kiem tra ket noi den cong 5173
Dim http, isRunning
isRunning = False

On Error Resume Next
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
http.setTimeouts 800, 800, 800, 800
http.open "HEAD", "http://127.0.0.1:5173/", False
http.send

If Err.Number = 0 Then
    isRunning = True
End If
Err.Clear
On Error GoTo 0

' Neu may chu chua chay, khoi dong npm run dev chay ngam
If Not isRunning Then
    WshShell.CurrentDirectory = "D:\AGENT_AI\BIMLearningHub"
    WshShell.Run "cmd /c npm run dev", 0, False
    WScript.Sleep 2500
End If

' Mo trinh duyet truc tiep den ung dung
WshShell.Run "http://127.0.0.1:5173/"
