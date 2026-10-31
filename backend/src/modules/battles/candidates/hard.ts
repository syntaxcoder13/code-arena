import { ProblemCandidate } from '../problem-candidate.types';

/**
 * Hard problems: the obvious answer is wrong or too slow, and the inputs are
 * chosen so that a naive attempt fails on one of them rather than passing by
 * luck.
 */
export const HARD_CANDIDATES: ProblemCandidate[] = [
  {
    slug: 'longest-valid-parentheses',
    title: 'Longest Valid Parentheses',
    statement: `Find the longest stretch of a line that is correctly bracketed.

**Input** — one line of \`(\` and \`)\` only (possibly empty).
**Output** — the length of the longest substring that is a balanced sequence of
brackets.

\`)()())\` gives \`4\`, from the middle \`()()\`.`,
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
      { input: ')()())', sample: true },
      { input: '(()', sample: true },
      { input: '' },
      { input: '()(()' },
      { input: '((((((' },
      { input: '()()()()' },
      { input: ')()())()()(' },
      { input: '(()())' },
    ],
    solutions: [
      // A stack of positions, measuring from the last unmatched bracket
      `const text = require('fs').readFileSync(0, 'utf8').replace(/\\n$/, '');
const stack = [-1];
let best = 0;
for (let i = 0; i < text.length; i++) {
  if (text[i] === '(') {
    stack.push(i);
  } else {
    stack.pop();
    if (stack.length === 0) stack.push(i);
    else if (i - stack[stack.length - 1] > best) best = i - stack[stack.length - 1];
  }
}
process.stdout.write(String(best));`,
      // A different route: two sweeps counting brackets, left then right
      `const text = require('fs').readFileSync(0, 'utf8').replace(/\\n$/, '');
let best = 0;
let open = 0;
let close = 0;
for (let i = 0; i < text.length; i++) {
  if (text[i] === '(') open++; else close++;
  if (open === close && open * 2 > best) best = open * 2;
  else if (close > open) { open = 0; close = 0; }
}
open = 0;
close = 0;
for (let i = text.length - 1; i >= 0; i--) {
  if (text[i] === '(') open++; else close++;
  if (open === close && open * 2 > best) best = open * 2;
  else if (open > close) { open = 0; close = 0; }
}
process.stdout.write(String(best));`,
    ],
  },

  {
    slug: 'median-of-stream',
    title: 'Running Median',
    statement: `Report the median after each number arrives.

**Input** — the first line is \`N\`, then \`N\` lines each holding one integer.
**Output** — \`N\` lines. After reading each number, print the median of
everything read so far.

With an even count the median is the average of the two middle values. Print
it as an integer when it is whole, and otherwise to one decimal place — so
\`2\`, not \`2.0\`, and \`2.5\` as \`2.5\`.`,
    language: 'python',
    difficulty: 'hard',
    timeLimitMs: 3000,
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: '4\n1\n3\n2\n4', sample: true },
      { input: '1\n5', sample: true },
      { input: '2\n1\n2' },
      { input: '5\n5\n4\n3\n2\n1' },
      { input: '3\n-1\n-2\n-3' },
      { input: '6\n2\n2\n2\n2\n2\n2' },
      { input: '4\n10\n1\n9\n2' },
    ],
    solutions: [
      // Two heaps, keeping the halves balanced
      `import sys, heapq
parts = sys.stdin.read().split()
n = int(parts[0]) if parts else 0
low = []   # max-heap by negation
high = []  # min-heap
out = []
for i in range(n):
    value = int(parts[i + 1])
    heapq.heappush(low, -value)
    heapq.heappush(high, -heapq.heappop(low))
    if len(high) > len(low):
        heapq.heappush(low, -heapq.heappop(high))
    if len(low) > len(high):
        median = float(-low[0])
    else:
        median = (-low[0] + high[0]) / 2.0
    out.append(str(int(median)) if median == int(median) else str(median))
sys.stdout.write("\\n".join(out))`,
      // A different route: keep the list sorted by inserting in place
      `import sys, bisect
parts = sys.stdin.read().split()
count = int(parts[0]) if parts else 0
seen = []
lines = []
for i in range(count):
    bisect.insort(seen, int(parts[i + 1]))
    size = len(seen)
    if size % 2 == 1:
        value = float(seen[size // 2])
    else:
        value = (seen[size // 2 - 1] + seen[size // 2]) / 2.0
    lines.append(str(int(value)) if value == int(value) else str(value))
sys.stdout.write("\\n".join(lines))`,
    ],
  },

  {
    slug: 'edit-distance',
    title: 'Edit Distance',
    statement: `Count the smallest number of edits that turn one word into another.

**Input** — two lines, each holding one lower case word (either may be empty).
**Output** — the least number of single character insertions, deletions or
replacements needed to turn the first word into the second.`,
    language: 'python',
    difficulty: 'hard',
    timeLimitMs: 3000,
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: 'horse\nros', sample: true },
      { input: 'intention\nexecution', sample: true },
      { input: '\n' },
      { input: 'abc\nabc' },
      { input: 'a\n' },
      { input: '\nabcd' },
      { input: 'kitten\nsitting' },
      { input: 'flaw\nlawn' },
    ],
    solutions: [
      // A full table, filled row by row
      `import sys
lines = sys.stdin.read().split("\\n")
a = lines[0].strip() if len(lines) > 0 else ""
b = lines[1].strip() if len(lines) > 1 else ""
table = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
for i in range(len(a) + 1):
    table[i][0] = i
for j in range(len(b) + 1):
    table[0][j] = j
for i in range(1, len(a) + 1):
    for j in range(1, len(b) + 1):
        if a[i - 1] == b[j - 1]:
            table[i][j] = table[i - 1][j - 1]
        else:
            table[i][j] = 1 + min(table[i - 1][j], table[i][j - 1], table[i - 1][j - 1])
sys.stdout.write(str(table[len(a)][len(b)]))`,
      // A different route: one rolling row instead of the whole table
      `import sys
text = sys.stdin.read().split("\\n")
first = text[0].strip() if len(text) > 0 else ""
second = text[1].strip() if len(text) > 1 else ""
row = list(range(len(second) + 1))
for i in range(1, len(first) + 1):
    previous = row[0]
    row[0] = i
    for j in range(1, len(second) + 1):
        carried = row[j]
        if first[i - 1] == second[j - 1]:
            row[j] = previous
        else:
            row[j] = 1 + min(previous, row[j], row[j - 1])
        previous = carried
sys.stdout.write(str(row[len(second)]))`,
    ],
  },

  {
    slug: 'largest-rectangle',
    title: 'Largest Rectangle',
    statement: `Find the biggest rectangle that fits under a skyline.

**Input** — one line of non-negative integers separated by single spaces, each
the height of a bar one unit wide.
**Output** — the area of the largest rectangle that fits entirely inside the
bars.

\`2 1 5 6 2 3\` gives \`10\`, from the two bars of height 5 and 6.`,
    language: 'java',
    difficulty: 'hard',
    timeLimitMs: 3000,
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // your code here
    }
}
`,
    inputs: [
      { input: '2 1 5 6 2 3', sample: true },
      { input: '2 4', sample: true },
      { input: '0' },
      { input: '5 5 5 5' },
      { input: '1 2 3 4 5' },
      { input: '5 4 3 2 1' },
      { input: '3 0 3' },
      { input: '6' },
    ],
    solutions: [
      // A stack of increasing heights, closing each bar as it is passed
      `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        List<Integer> bars = new ArrayList<Integer>();
        while (scanner.hasNextInt()) bars.add(scanner.nextInt());
        Deque<Integer> stack = new ArrayDeque<Integer>();
        long best = 0;
        for (int i = 0; i <= bars.size(); i++) {
            int height = (i == bars.size()) ? 0 : bars.get(i);
            while (!stack.isEmpty() && bars.get(stack.peek()) >= height) {
                int top = bars.get(stack.pop());
                int left = stack.isEmpty() ? -1 : stack.peek();
                long area = (long) top * (i - left - 1);
                if (area > best) best = area;
            }
            stack.push(i);
        }
        System.out.print(best);
    }
}`,
      // A different route: for each bar, widen outwards while it stays tall enough
      `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        List<Integer> bars = new ArrayList<Integer>();
        while (scanner.hasNextInt()) bars.add(scanner.nextInt());
        long best = 0;
        for (int i = 0; i < bars.size(); i++) {
            int height = bars.get(i);
            int left = i;
            int right = i;
            while (left - 1 >= 0 && bars.get(left - 1) >= height) left--;
            while (right + 1 < bars.size() && bars.get(right + 1) >= height) right++;
            long area = (long) height * (right - left + 1);
            if (area > best) best = area;
        }
        System.out.print(best);
    }
}`,
    ],
  },

  {
    slug: 'course-order',
    title: 'Course Order',
    statement: `Put courses in an order that respects their prerequisites.

**Input** — the first line is \`N\` and \`M\`: the number of courses and the number
of rules. Courses are numbered \`0\` to \`N-1\`. Then \`M\` lines of \`a b\`, meaning
\`a\` must be taken before \`b\`.
**Output** — the course numbers in a valid order, separated by single spaces.
When several courses are available at once, take the lowest number first.
Print \`impossible\` if no order exists.`,
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
      { input: '4 3\n0 1\n1 2\n2 3', sample: true },
      { input: '2 2\n0 1\n1 0', sample: true },
      { input: '3 0' },
      { input: '1 0' },
      { input: '4 2\n1 0\n3 2' },
      { input: '5 4\n0 1\n0 2\n1 3\n2 3' },
      { input: '3 3\n0 1\n1 2\n2 0' },
    ],
    solutions: [
      // Repeatedly take the lowest course with nothing left before it
      `package main

import (
	"bufio"
	"fmt"
	"os"
	"sort"
	"strconv"
	"strings"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	var n, m int
	fmt.Fscan(reader, &n, &m)
	after := make([][]int, n)
	waiting := make([]int, n)
	for i := 0; i < m; i++ {
		var a, b int
		fmt.Fscan(reader, &a, &b)
		after[a] = append(after[a], b)
		waiting[b]++
	}
	ready := []int{}
	for i := 0; i < n; i++ {
		if waiting[i] == 0 {
			ready = append(ready, i)
		}
	}
	order := []string{}
	for len(ready) > 0 {
		sort.Ints(ready)
		next := ready[0]
		ready = ready[1:]
		order = append(order, strconv.Itoa(next))
		for _, other := range after[next] {
			waiting[other]--
			if waiting[other] == 0 {
				ready = append(ready, other)
			}
		}
	}
	if len(order) != n {
		fmt.Print("impossible")
		return
	}
	fmt.Print(strings.Join(order, " "))
}`,
      // A different route: scan for the lowest available course each round
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
	var n, m int
	fmt.Fscan(reader, &n, &m)
	before := make([][]bool, n)
	for i := range before {
		before[i] = make([]bool, n)
	}
	for i := 0; i < m; i++ {
		var a, b int
		fmt.Fscan(reader, &a, &b)
		before[b][a] = true
	}
	done := make([]bool, n)
	order := []string{}
	for step := 0; step < n; step++ {
		picked := -1
		for course := 0; course < n && picked == -1; course++ {
			if done[course] {
				continue
			}
			blocked := false
			for other := 0; other < n; other++ {
				if before[course][other] && !done[other] {
					blocked = true
					break
				}
			}
			if !blocked {
				picked = course
			}
		}
		if picked == -1 {
			fmt.Print("impossible")
			return
		}
		done[picked] = true
		order = append(order, strconv.Itoa(picked))
	}
	fmt.Print(strings.Join(order, " "))
}`,
    ],
  },
];
