import { ProblemCandidate } from '../problem-candidate.types';

/** Fourth batch, medium. */
export const MEDIUM_CANDIDATES_4: ProblemCandidate[] = [
  {
    slug: 'longest-consecutive',
    title: 'Longest Consecutive Run',
    statement: `Find the longest run of consecutive numbers hidden in a list.

**Input** — one line of integers separated by single spaces, in no particular
order and possibly with repeats (possibly empty).
**Output** — the length of the longest set of consecutive values present.

\`100 4 200 1 3 2\` holds \`1 2 3 4\`, so the answer is \`4\`. The numbers need not
be next to each other in the input.`,
    language: 'javascript',
    difficulty: 'medium',
    starterCode: `const input = require('fs').readFileSync(0, 'utf8');

function solve(input) {
  // your code here
}

process.stdout.write(String(solve(input)));
`,
    inputs: [
      { input: '100 4 200 1 3 2', sample: true },
      { input: '1 1 1', sample: true },
      { input: '' },
      { input: '5' },
      { input: '9 1 4 7 3 2 8' },
      { input: '-2 -1 0 1' },
      { input: '10 30 20' },
    ],
    solutions: [
      // A set, growing only from values that start a run
      `const tokens = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).filter((t) => t !== '');
const seen = new Set(tokens.map(Number));
let best = 0;
for (const value of seen) {
  if (seen.has(value - 1)) continue;
  let length = 1;
  while (seen.has(value + length)) length++;
  if (length > best) best = length;
}
process.stdout.write(String(best));`,
      // A different route: sort, then walk counting the steps of one
      `const parts = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).filter((p) => p !== '');
const nums = [...new Set(parts.map(Number))].sort((a, b) => a - b);
let best = nums.length === 0 ? 0 : 1;
let run = nums.length === 0 ? 0 : 1;
for (let i = 1; i < nums.length; i++) {
  run = nums[i] === nums[i - 1] + 1 ? run + 1 : 1;
  if (run > best) best = run;
}
process.stdout.write(String(best));`,
    ],
  },

  {
    slug: 'stack-with-minimum',
    title: 'The Stack That Knows Its Smallest',
    statement: `Run a stack that can also report its smallest value.

**Input** — the first line is \`N\`, then \`N\` lines of commands. A command is
\`push v\`, \`pop\`, or \`min\`.
**Output** — one line for each \`min\`, holding the smallest value currently on
the stack, or \`empty\` if there is nothing on it.

A \`pop\` on an empty stack does nothing.`,
    language: 'python',
    difficulty: 'medium',
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: '6\npush 3\npush 1\nmin\npop\nmin\npop', sample: true },
      { input: '3\nmin\npop\nmin', sample: true },
      { input: '5\npush 5\npush 5\npop\nmin\npop' },
      { input: '4\npush -2\npush -7\nmin\npop' },
      { input: '7\npush 4\npush 9\npush 2\nmin\npop\nmin\npop' },
      { input: '2\npush 0\nmin' },
      { input: '6\npush 8\npop\npop\nmin\npush 1\nmin' },
    ],
    solutions: [
      // A second stack carrying the smallest so far
      `import sys
lines = sys.stdin.read().split("\\n")
n = int(lines[0].strip()) if lines and lines[0].strip() else 0
values = []
smallest = []
out = []
for i in range(n):
    parts = lines[1 + i].split()
    if parts[0] == "push":
        v = int(parts[1])
        values.append(v)
        smallest.append(v if not smallest else min(v, smallest[-1]))
    elif parts[0] == "pop":
        if values:
            values.pop()
            smallest.pop()
    else:
        out.append(str(smallest[-1]) if smallest else "empty")
sys.stdout.write("\\n".join(out))`,
      // A different route: one stack, and a look through it when asked
      `import sys
rows = sys.stdin.read().split("\\n")
count = int(rows[0].strip()) if rows and rows[0].strip() else 0
stack = []
answers = []
for i in range(count):
    command = rows[1 + i].split()
    if command[0] == "push":
        stack.append(int(command[1]))
    elif command[0] == "pop":
        if len(stack) > 0:
            del stack[-1]
    else:
        if len(stack) == 0:
            answers.append("empty")
        else:
            lowest = stack[0]
            for v in stack:
                if v < lowest:
                    lowest = v
            answers.append(str(lowest))
sys.stdout.write("\\n".join(answers))`,
    ],
  },

  {
    slug: 'runs-that-total',
    title: 'Runs That Total K',
    statement: `Count the stretches of a list that add up to a given number.

**Input** — the first line is \`K\`, the second line is integers separated by
single spaces (possibly empty).
**Output** — how many runs of one or more neighbouring numbers add up to
exactly \`K\`.

Runs that start or end at different places count separately, even if they hold
the same values.`,
    language: 'python',
    difficulty: 'medium',
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: '2\n1 1 1', sample: true },
      { input: '3\n1 2 3', sample: true },
      { input: '5\n' },
      { input: '0\n1 -1 1 -1' },
      { input: '7\n1 2 3' },
      { input: '-3\n-1 -2 -3' },
      { input: '4\n4 0 0' },
    ],
    solutions: [
      // Running totals, counting how often each one has been seen before
      `import sys
lines = sys.stdin.read().split("\\n")
k = int(lines[0].strip())
nums = [int(x) for x in lines[1].split()] if len(lines) > 1 and lines[1].strip() else []
seen = {0: 1}
running = 0
found = 0
for v in nums:
    running += v
    found += seen.get(running - k, 0)
    seen[running] = seen.get(running, 0) + 1
sys.stdout.write(str(found))`,
      // A different route: add up every run and check it
      `import sys
rows = sys.stdin.read().split("\\n")
target = int(rows[0].strip())
values = [int(x) for x in rows[1].split()] if len(rows) > 1 and rows[1].strip() else []
count = 0
for start in range(len(values)):
    total = 0
    for end in range(start, len(values)):
        total += values[end]
        if total == target:
            count += 1
sys.stdout.write(str(count))`,
    ],
  },

  {
    slug: 'zigzag-rows',
    title: 'Written in a Zigzag',
    statement: `Read text that was written down a zigzag.

**Input** — the first line is \`R\`, the second line is the text (possibly
empty).
**Output** — the text written in a zigzag over \`R\` rows, then read back row by
row, with nothing between the characters.

With \`R\` of 3, \`PAYPALISHIRING\` is written as

\`\`\`
P   A   H   N
A P L S I I G
Y   I   R
\`\`\`

and reads back as \`PAHNAPLSIIGYIR\`. With \`R\` of 1 the text is unchanged.`,
    language: 'java',
    difficulty: 'medium',
    starterCode: `import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        int rows = Integer.parseInt(reader.readLine().trim());
        String text = reader.readLine();
        if (text == null) text = "";
        // your code here
    }
}
`,
    inputs: [
      { input: '3\nPAYPALISHIRING', sample: true },
      { input: '1\nABCDE', sample: true },
      { input: '2\n' },
      { input: '4\nPAYPALISHIRING' },
      { input: '2\nABCDEF' },
      { input: '5\nAB' },
      { input: '3\nABCD' },
    ],
    solutions: [
      // Deal each character into a row, turning round at the edges
      `import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        int rows = Integer.parseInt(reader.readLine().trim());
        String text = reader.readLine();
        if (text == null) text = "";
        if (rows <= 1) { System.out.print(text); return; }
        StringBuilder[] lines = new StringBuilder[rows];
        for (int i = 0; i < rows; i++) lines[i] = new StringBuilder();
        int row = 0;
        int step = 1;
        for (char c : text.toCharArray()) {
            lines[row].append(c);
            if (row == 0) step = 1;
            else if (row == rows - 1) step = -1;
            row += step;
        }
        StringBuilder out = new StringBuilder();
        for (StringBuilder line : lines) out.append(line);
        System.out.print(out);
    }
}`,
      // A different route: work out which row each position lands in
      `import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        int height = Integer.parseInt(reader.readLine().trim());
        String body = reader.readLine();
        if (body == null) body = "";
        if (height <= 1) { System.out.print(body); return; }
        int cycle = 2 * height - 2;
        StringBuilder out = new StringBuilder();
        for (int wanted = 0; wanted < height; wanted++) {
            for (int at = 0; at < body.length(); at++) {
                int place = at % cycle;
                int row = place < height ? place : cycle - place;
                if (row == wanted) out.append(body.charAt(at));
            }
        }
        System.out.print(out);
    }
}`,
    ],
  },

  {
    slug: 'rotate-by-k',
    title: 'Rotate by K',
    statement: `Move every number along by a fixed amount, wrapping round.

**Input** — the first line is \`K\`, the second line is integers separated by
single spaces (possibly empty).
**Output** — the numbers moved \`K\` places to the right, with whatever falls
off the end coming back at the front, separated by single spaces.

\`K\` may be larger than the number of values, and may be zero.`,
    language: 'go',
    difficulty: 'medium',
    starterCode: `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	var k int
	fmt.Fscan(reader, &k)
	// your code here
}
`,
    inputs: [
      { input: '2\n1 2 3 4 5', sample: true },
      { input: '0\n1 2 3', sample: true },
      { input: '3\n' },
      { input: '1\n7' },
      { input: '7\n1 2 3' },
      { input: '4\n1 2 3 4' },
      { input: '5\n9 8 7 6 5 4' },
    ],
    solutions: [
      // Build the answer straight into its new places
      `package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	var k int
	fmt.Fscan(reader, &k)
	nums := []int{}
	for {
		var n int
		if _, err := fmt.Fscan(reader, &n); err != nil {
			break
		}
		nums = append(nums, n)
	}
	size := len(nums)
	if size == 0 {
		fmt.Print("")
		return
	}
	shift := k % size
	out := make([]string, size)
	for i, v := range nums {
		out[(i+shift)%size] = strconv.Itoa(v)
	}
	fmt.Print(strings.Join(out, " "))
}`,
      // A different route: reverse the whole thing, then each piece
      `package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func flip(values []int, from, to int) {
	for from < to {
		values[from], values[to] = values[to], values[from]
		from++
		to--
	}
}

func main() {
	reader := bufio.NewReader(os.Stdin)
	var k int
	fmt.Fscan(reader, &k)
	values := []int{}
	for {
		var n int
		if _, err := fmt.Fscan(reader, &n); err != nil {
			break
		}
		values = append(values, n)
	}
	n := len(values)
	if n == 0 {
		fmt.Print("")
		return
	}
	shift := k % n
	flip(values, 0, n-1)
	flip(values, 0, shift-1)
	flip(values, shift, n-1)
	out := make([]string, n)
	for i, v := range values {
		out[i] = strconv.Itoa(v)
	}
	fmt.Print(strings.Join(out, " "))
}`,
    ],
  },
];
