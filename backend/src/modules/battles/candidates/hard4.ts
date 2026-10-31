import { ProblemCandidate } from '../problem-candidate.types';

/** Fourth batch, hard. */
export const HARD_CANDIDATES_4: ProblemCandidate[] = [
  {
    slug: 'evaluate-expression',
    title: 'Work Out the Sum',
    statement: `Work out the value of an arithmetic expression.

**Input** — one line holding non-negative integers, the operators \`+\`, \`-\`,
\`*\` and \`/\`, and round brackets. There may be spaces anywhere.
**Output** — the value, as an integer.

\`*\` and \`/\` bind tighter than \`+\` and \`-\`, and brackets bind tightest of all.
Division throws away any remainder and rounds towards zero, so \`7/2\` is \`3\` and
\`-7/2\` is \`-3\`.`,
    language: 'javascript',
    difficulty: 'hard',
    timeLimitMs: 3000,
    starterCode: `const input = require('fs').readFileSync(0, 'utf8');

function solve(input) {
  // your code here
}

process.stdout.write(String(solve(input)));
`,
    inputs: [
      { input: '2+3*4', sample: true },
      { input: '(2+3)*4', sample: true },
      { input: '7/2' },
      { input: '2*(3+(4-1))' },
      { input: '100' },
      { input: '10 - 2 - 3' },
      { input: '(1+2)*(3+4)/2' },
      { input: '0-7/2' },
    ],
    solutions: [
      // Recursive descent: sums of products of atoms
      `const text = require('fs').readFileSync(0, 'utf8').replace(/\\s+/g, '');
let at = 0;

function atom() {
  if (text[at] === '(') {
    at++;
    const value = sum();
    at++; // the closing bracket
    return value;
  }
  let digits = '';
  while (at < text.length && text[at] >= '0' && text[at] <= '9') digits += text[at++];
  return Number(digits);
}

function product() {
  let value = atom();
  while (text[at] === '*' || text[at] === '/') {
    const op = text[at++];
    const next = atom();
    value = op === '*' ? value * next : Math.trunc(value / next);
  }
  return value;
}

function sum() {
  let value = product();
  while (text[at] === '+' || text[at] === '-') {
    const op = text[at++];
    const next = product();
    value = op === '+' ? value + next : value - next;
  }
  return value;
}

process.stdout.write(String(sum()));`,
      // A different route: shunting yard into postfix, then evaluate it
      `const source = require('fs').readFileSync(0, 'utf8').replace(/\\s+/g, '');
const tokens = source.match(/\\d+|[-+*/()]/g) ?? [];
const binds = { '+': 1, '-': 1, '*': 2, '/': 2 };
const output = [];
const operators = [];
for (const token of tokens) {
  if (/^\\d+$/.test(token)) {
    output.push(Number(token));
  } else if (token === '(') {
    operators.push(token);
  } else if (token === ')') {
    while (operators.length && operators[operators.length - 1] !== '(') output.push(operators.pop());
    operators.pop();
  } else {
    while (
      operators.length &&
      operators[operators.length - 1] !== '(' &&
      binds[operators[operators.length - 1]] >= binds[token]
    ) {
      output.push(operators.pop());
    }
    operators.push(token);
  }
}
while (operators.length) output.push(operators.pop());

const stack = [];
for (const item of output) {
  if (typeof item === 'number') {
    stack.push(item);
  } else {
    const right = stack.pop();
    const left = stack.pop();
    if (item === '+') stack.push(left + right);
    else if (item === '-') stack.push(left - right);
    else if (item === '*') stack.push(left * right);
    else stack.push(Math.trunc(left / right));
  }
}
process.stdout.write(String(stack.pop()));`,
    ],
  },

  {
    slug: 'smallest-window',
    title: 'The Smallest Window',
    statement: `Find the shortest stretch of a line holding every required letter.

**Input** — two lines: the text, then the letters that must appear (possibly
with repeats). Either may be empty.
**Output** — the shortest substring of the text containing every required
letter, counting repeats, or nothing at all if there is none.

Where two are equally short, print the one that starts earliest.`,
    language: 'python',
    difficulty: 'hard',
    timeLimitMs: 3000,
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: 'ADOBECODEBANC\nABC', sample: true },
      { input: 'a\naa', sample: true },
      { input: '\n' },
      { input: 'abc\n' },
      { input: 'aaflslflsldkalskaaa\naaa' },
      { input: 'ab\nb' },
      { input: 'bba\nab' },
    ],
    solutions: [
      // A window that grows on the right and shrinks on the left
      `import sys
from collections import Counter

rows = sys.stdin.read().split("\\n")
text = rows[0] if rows else ""
need = rows[1] if len(rows) > 1 else ""

if need == "":
    sys.stdout.write("")
else:
    wanted = Counter(need)
    missing = len(need)
    best_at = -1
    best_len = len(text) + 1
    left = 0
    for right, ch in enumerate(text):
        if wanted[ch] > 0:
            missing -= 1
        wanted[ch] -= 1
        while missing == 0:
            if right - left + 1 < best_len:
                best_len = right - left + 1
                best_at = left
            wanted[text[left]] += 1
            if wanted[text[left]] > 0:
                missing += 1
            left += 1
    sys.stdout.write("" if best_at < 0 else text[best_at:best_at + best_len])`,
      // A different route: try every start, growing until it is satisfied
      `import sys
from collections import Counter

lines = sys.stdin.read().split("\\n")
body = lines[0] if lines else ""
required = lines[1] if len(lines) > 1 else ""

if required == "":
    sys.stdout.write("")
else:
    target = Counter(required)
    answer = ""
    for start in range(len(body)):
        have = Counter()
        for end in range(start, len(body)):
            have[body[end]] += 1
            ok = True
            for ch, n in target.items():
                if have[ch] < n:
                    ok = False
                    break
            if ok:
                piece = body[start:end + 1]
                if answer == "" or len(piece) < len(answer):
                    answer = piece
                break
    sys.stdout.write(answer)`,
    ],
  },

  {
    slug: 'best-paid-schedule',
    title: 'The Best Paid Day',
    statement: `Pick the jobs that pay the most without overlapping.

**Input** — the first line is \`N\`, then \`N\` lines of \`start end pay\`
(integers, \`start < end\`, in no particular order).
**Output** — the largest total pay from a set of jobs where no two overlap.

A job that ends exactly when another begins may be taken as well.`,
    language: 'python',
    difficulty: 'hard',
    timeLimitMs: 3000,
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: '4\n1 3 50\n2 5 20\n4 6 70\n6 7 60', sample: true },
      { input: '3\n1 2 5\n1 2 7\n1 2 6', sample: true },
      { input: '0' },
      { input: '1\n0 10 100' },
      { input: '3\n1 2 10\n2 3 10\n3 4 10' },
      { input: '2\n1 10 5\n2 3 4' },
      { input: '4\n1 4 20\n3 5 20\n0 6 45\n5 7 10' },
    ],
    solutions: [
      // Jobs in order of when they end, each asking what came before it
      `import sys
import bisect

parts = sys.stdin.read().split()
n = int(parts[0]) if parts else 0
jobs = []
for i in range(n):
    s = int(parts[1 + 3 * i])
    e = int(parts[2 + 3 * i])
    p = int(parts[3 + 3 * i])
    jobs.append((e, s, p))
jobs.sort()
ends = [j[0] for j in jobs]
best = [0] * (n + 1)
for i in range(n):
    end, start, pay = jobs[i]
    before = bisect.bisect_right(ends, start, 0, i)
    best[i + 1] = max(best[i], best[before] + pay)
sys.stdout.write(str(best[n]))`,
      // A different route: try taking or leaving each job, remembering results
      `import sys
sys.setrecursionlimit(10000)

tokens = sys.stdin.read().split()
count = int(tokens[0]) if tokens else 0
work = []
for i in range(count):
    work.append((
        int(tokens[1 + 3 * i]),
        int(tokens[2 + 3 * i]),
        int(tokens[3 + 3 * i]),
    ))
work.sort()
remembered = {}

def from_job(i, free_at):
    if i == len(work):
        return 0
    key = (i, free_at)
    if key in remembered:
        return remembered[key]
    start, end, pay = work[i]
    skip = from_job(i + 1, free_at)
    take = pay + from_job(i + 1, end) if start >= free_at else 0
    remembered[key] = max(skip, take)
    return remembered[key]

sys.stdout.write(str(from_job(0, -10 ** 9)))`,
    ],
  },

  {
    slug: 'merge-sorted-lists',
    title: 'Merge Them All',
    statement: `Merge several sorted lists into one.

**Input** — the first line is \`K\`, then \`K\` lines each holding one list of
integers in increasing order, separated by single spaces. A list may be empty.
**Output** — every number from every list, in increasing order, separated by
single spaces.`,
    language: 'java',
    difficulty: 'hard',
    timeLimitMs: 3000,
    starterCode: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        int k = Integer.parseInt(reader.readLine().trim());
        // your code here
    }
}
`,
    inputs: [
      { input: '3\n1 4 5\n1 3 4\n2 6', sample: true },
      { input: '2\n\n1 2 3', sample: true },
      { input: '0' },
      { input: '1\n5' },
      { input: '3\n\n\n' },
      { input: '2\n-5 -1\n-3 0 2' },
      { input: '4\n1\n1\n1\n1' },
    ],
    solutions: [
      // A heap holding the next value from each list
      `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String header = reader.readLine();
        int k = (header == null || header.trim().isEmpty()) ? 0 : Integer.parseInt(header.trim());
        List<int[]> lists = new ArrayList<>();
        for (int i = 0; i < k; i++) {
            String line = reader.readLine();
            if (line == null) line = "";
            line = line.trim();
            if (line.isEmpty()) {
                lists.add(new int[0]);
            } else {
                String[] parts = line.split("\\\\s+");
                int[] values = new int[parts.length];
                for (int j = 0; j < parts.length; j++) values[j] = Integer.parseInt(parts[j]);
                lists.add(values);
            }
        }
        // each entry is {value, which list, position in it}
        PriorityQueue<int[]> next = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        for (int i = 0; i < lists.size(); i++) {
            if (lists.get(i).length > 0) next.add(new int[] {lists.get(i)[0], i, 0});
        }
        StringBuilder out = new StringBuilder();
        while (!next.isEmpty()) {
            int[] top = next.poll();
            if (out.length() > 0) out.append(' ');
            out.append(top[0]);
            int at = top[2] + 1;
            if (at < lists.get(top[1]).length) next.add(new int[] {lists.get(top[1])[at], top[1], at});
        }
        System.out.print(out);
    }
}`,
      // A different route: gather everything, then sort it
      `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String first = reader.readLine();
        int count = (first == null || first.trim().isEmpty()) ? 0 : Integer.parseInt(first.trim());
        List<Integer> everything = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            String line = reader.readLine();
            if (line == null) continue;
            line = line.trim();
            if (line.isEmpty()) continue;
            for (String part : line.split("\\\\s+")) everything.add(Integer.parseInt(part));
        }
        Collections.sort(everything);
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < everything.size(); i++) {
            if (i > 0) out.append(' ');
            out.append(everything.get(i));
        }
        System.out.print(out);
    }
}`,
    ],
  },

  {
    slug: 'longest-rising',
    title: 'Longest Rising Run',
    statement: `Find the longest rising sequence hidden in a list.

**Input** — one line of integers separated by single spaces (possibly empty).
**Output** — the length of the longest strictly increasing sequence that can
be taken from it without changing the order.

The numbers need not be next to each other. \`10 9 2 5 3 7 101 18\` gives \`4\`,
from \`2 3 7 101\`.`,
    language: 'go',
    difficulty: 'hard',
    timeLimitMs: 3000,
    starterCode: `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	_ = reader
	fmt.Print("")
}
`,
    inputs: [
      { input: '10 9 2 5 3 7 101 18', sample: true },
      { input: '7 7 7 7', sample: true },
      { input: '' },
      { input: '5' },
      { input: '1 2 3 4 5' },
      { input: '5 4 3 2 1' },
      { input: '0 8 4 12 2 10 6 14 1 9' },
    ],
    solutions: [
      // Keep the smallest value that can end a run of each length
      `package main

import (
	"bufio"
	"fmt"
	"os"
	"sort"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	nums := []int{}
	for {
		var n int
		if _, err := fmt.Fscan(reader, &n); err != nil {
			break
		}
		nums = append(nums, n)
	}
	tails := []int{}
	for _, v := range nums {
		at := sort.SearchInts(tails, v)
		if at == len(tails) {
			tails = append(tails, v)
		} else {
			tails[at] = v
		}
	}
	fmt.Print(len(tails))
}`,
      // A different route: for each place, the best run that ends there
      `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	values := []int{}
	for {
		var n int
		if _, err := fmt.Fscan(reader, &n); err != nil {
			break
		}
		values = append(values, n)
	}
	best := 0
	endingHere := make([]int, len(values))
	for i := range values {
		endingHere[i] = 1
		for j := 0; j < i; j++ {
			if values[j] < values[i] && endingHere[j]+1 > endingHere[i] {
				endingHere[i] = endingHere[j] + 1
			}
		}
		if endingHere[i] > best {
			best = endingHere[i]
		}
	}
	fmt.Print(best)
}`,
    ],
  },
];
