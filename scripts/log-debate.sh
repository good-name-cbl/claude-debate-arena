#!/bin/bash
# Usage: log-debate.sh <sender> <recipient> <messageType> <summary> <content>
SENDER="$1"
RECIPIENT="$2"
MSG_TYPE="$3"
SUMMARY="$4"
CONTENT="$5"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)
DATA_DIR="/home/makkan/workspace/claude_code_test/debate-data"
OUTPUT="$DATA_DIR/current.jsonl"
mkdir -p "$DATA_DIR"
node -e "
const r = {
  timestamp: '$TIMESTAMP',
  sender: process.argv[1],
  recipient: process.argv[2],
  content: process.argv[3],
  summary: process.argv[4],
  messageType: process.argv[5]
};
process.stdout.write(JSON.stringify(r) + '\n');
" "$SENDER" "$RECIPIENT" "$CONTENT" "$SUMMARY" "$MSG_TYPE" >> "$OUTPUT"
