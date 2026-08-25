# Printer problem

A printer can appear unavailable when the local print service has lost its connection or the printer is paused. Advisor OS checks the print service and the printer connection without reading documents, browser data, or client information.

## What the diagnosis shares

The diagnostic request is limited to printer state, print-service state, operating-system version, and sanitized error codes. It does not include document names, file paths, account credentials, browser contents, cookies, or client information.

## Reconnect action

Reconnect is a reversible action. Advisor OS asks for approval before it runs and verifies the printer with a test page afterward. If the test fails, no further system change is attempted automatically.
