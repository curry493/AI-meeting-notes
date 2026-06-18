Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = WScript.Arguments(0)
WshShell.Run """ & WScript.Arguments(1) & """" & " server.js", 0, False
Set WshShell = Nothing
