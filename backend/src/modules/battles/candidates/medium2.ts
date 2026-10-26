import { ProblemCandidate } from '../problem-candidate.types';

/** Second batch, medium. */
export const MEDIUM_CANDIDATES_2: ProblemCandidate[] = [
  {
    slug: 'spiral-order',
    title: 'Spiral Order',
    statement: `Read a grid in a spiral, clockwise from the top left.

**Input** — the first line is \`R\` and \`C\`, then \`R\` lines of \`C\` integers.
**Output** — every value in spiral order, separated by single spaces.

A grid with no rows produces no output.`,
    language: 'javascript',
    difficulty: 'medium',
    starterCode: `const input = require('fs').readFileSync(0, 'utf8');

function solve(input) {
  // your code here
}

process.stdout.write(String(solve(input)));
`,
    inputs: [
      { input: '3 3\n1 2 3\n4 5 6\n7 8 9', sample: true },
      { input: '2 2\n1 2\n3 4', sample: true },
      { input: '0 0' },
      { input: '1 1\n7' },
      { input: '1 4\n1 2 3 4' },
      { input: '4 1\n1\n2\n3\n4' },
      { input: '3 2\n1 2\n3 4\n5 6' },
    ],
    solutions: [
      // Four boundaries, closing inwards
      `const parts = require('fs').readFileSync(0, 'utf8').split(/\\s+/).filter((p) => p !== '');
const rows = Number(parts[0] ?? 0);
const cols = Number(parts[1] ?? 0);
const grid = [];
let at = 2;
for (let r = 0; r < rows; r++) {
  const row = [];
  for (let c = 0; c < cols; c++) row.push(parts[at++]);
  grid.push(row);
}
let top = 0, bottom = rows - 1, left = 0, right = cols - 1;
const out = [];
while (top <= bottom && left <= right) {
  for (let c = left; c <= right; c++) out.push(grid[top][c]);
  top++;
  for (let r = top; r <= bottom; r++) out.push(grid[r][right]);
  right--;
  if (top <= bottom) {
    for (let c = right; c >= left; c--) out.push(grid[bottom][c]);
    bottom--;
  }
  if (left <= right) {
    for (let r = bottom; r >= top; r--) out.push(grid[r][left]);
    left++;
  }
}
process.stdout.write(out.join(' '));`,
      // A different route: walk with a direction, turning when blocked
      `const tokens = require('fs').readFileSync(0, 'utf8').split(/\\s+/).filter((t) => t !== '');
const rows = Number(tokens[0] ?? 0);
const cols = Number(tokens[1] ?? 0);
const grid = [];
let cursor = 2;
for (let r = 0; r < rows; r++) {
  const row = [];
  for (let c = 0; c < cols; c++) row.push(tokens[cursor++]);
  grid.push(row);
}
const seen = new Set();
const steps = [[0, 1], [1, 0], [0, -1], [-1, 0]];
let r = 0, c = 0, dir = 0;
const out = [];
const total = rows * cols;
for (let n = 0; n < total; n++) {
  out.push(grid[r][c]);
  seen.add(r + ',' + c);
  let nr = r + steps[dir][0];
  let nc = c + steps[dir][1];
  if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || seen.has(nr + ',' + nc)) {
    dir = (dir + 1) % 4;
    nr = r + steps[dir][0];
    nc = c + steps[dir][1];
  }
  r = nr;
  c = nc;
}
process.stdout.write(out.join(' '));`,
    ],
  },

  {
    slug: 'decode-repeats',
    title: 'Decode the Repeats',
    statement: `Expand a string written with repeat counts.

**Input** — one line in which \`K[body]\` means the body repeated \`K\` times.
These may be nested, and the body may be empty. The line may be empty.
**Output** — the expanded text.

\`3[a]2[bc]\` becomes \`aaabcbc\`, and \`3[a2[c]]\` becomes \`accaccacc\`.`,
    language: 'python',
    difficulty: 'medium',
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: '3[a]2[bc]', sample: true },
      { input: '3[a2[c]]', sample: true },
      { input: '' },
      { input: 'plain' },
      { input: '2[abc]3[cd]ef' },
      { input: '10[z]' },
      { input: '2[2[2[a]]]' },
    ],
    solutions: [
      // A stack of what was being built when each bracket opened
      `import sys
line = sys.stdin.read().strip()
stack = []
current = ""
count = 0
for ch in line:
    if ch.isdigit():
        count = count * 10 + int(ch)
    elif ch == "[":
        stack.append((current, count))
        current = ""
        count = 0
    elif ch == "]":
        before, times = stack.pop()
        current = before + current * times
    else:
        current += ch
sys.stdout.write(current)`,
      // A different route: read it as a grammar, recursively
      `import sys

text = sys.stdin.read().strip()
pos = 0

def parse():
    global pos
    out = ""
    while pos < len(text) and text[pos] != "]":
        if text[pos].isdigit():
            number = 0
            while text[pos].isdigit():
                number = number * 10 + int(text[pos])
                pos += 1
            pos += 1          # the [
            body = parse()
            pos += 1          # the ]
            out += body * number
        else:
            out += text[pos]
            pos += 1
    return out

sys.stdout.write(parse())`,
    ],
  },

  {
    slug: 'meeting-rooms',
    title: 'How Many Rooms',
    statement: `Work out how many rooms a day of meetings needs.

**Input** — the first line is \`N\`, then \`N\` lines of \`start end\` (integers,
\`start < end\`, in no particular order).
**Output** — the smallest number of rooms that holds every meeting.

A meeting that ends exactly when another begins can reuse the same room.`,
    language: 'python',
    difficulty: 'medium',
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: '3\n0 30\n5 10\n15 20', sample: true },
      { input: '3\n1 2\n2 3\n3 4', sample: true },
      { input: '0' },
      { input: '1\n1 5' },
      { input: '2\n7 10\n2 4' },
      { input: '4\n1 10\n2 3\n4 5\n6 7' },
      { input: '5\n1 5\n1 5\n1 5\n1 5\n1 5' },
    ],
    solutions: [
      // Walk the starts and the ends in order, counting what is open
      `import sys
parts = sys.stdin.read().split()
n = int(parts[0]) if parts else 0
starts = sorted(int(parts[1 + 2 * i]) for i in range(n))
ends = sorted(int(parts[2 + 2 * i]) for i in range(n))
rooms = 0
most = 0
s = e = 0
while s < n:
    if starts[s] < ends[e]:
        rooms += 1
        most = max(most, rooms)
        s += 1
    else:
        rooms -= 1
        e += 1
sys.stdout.write(str(most))`,
      // A different route: a heap of when each open room frees up
      `import sys, heapq
tokens = sys.stdin.read().split()
count = int(tokens[0]) if tokens else 0
meetings = []
for i in range(count):
    meetings.append((int(tokens[1 + 2 * i]), int(tokens[2 + 2 * i])))
meetings.sort()
free_at = []
for start, end in meetings:
    if free_at and free_at[0] <= start:
        heapq.heapreplace(free_at, end)
    else:
        heapq.heappush(free_at, end)
sys.stdout.write(str(len(free_at)))`,
    ],
  },

  {
    slug: 'common-prefix',
    title: 'Longest Common Prefix',
    statement: `Find the start that every word shares.

**Input** — the first line is \`N\`, then \`N\` lines each holding one lower case
word.
**Output** — the longest prefix common to all of them, or nothing at all if
they share none.`,
    language: 'java',
    difficulty: 'medium',
    starterCode: `import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(reader.readLine().trim());
        // your code here
    }
}
`,
    inputs: [
      { input: '3\nflower\nflow\nflight', sample: true },
      { input: '3\ndog\nracecar\ncar', sample: true },
      { input: '0' },
      { input: '1\nalone' },
      { input: '2\nsame\nsame' },
      { input: '3\na\nab\nabc' },
      { input: '2\nprefix\npre' },
    ],
    solutions: [
      // Compare the same position in every word, until one disagrees
      `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String header = reader.readLine();
        int n = (header == null || header.trim().isEmpty()) ? 0 : Integer.parseInt(header.trim());
        List<String> words = new ArrayList<>();
        for (int i = 0; i < n; i++) words.add(reader.readLine().trim());
        if (words.isEmpty()) { System.out.print(""); return; }
        StringBuilder prefix = new StringBuilder();
        for (int at = 0; at < words.get(0).length(); at++) {
            char c = words.get(0).charAt(at);
            for (String word : words) {
                if (at >= word.length() || word.charAt(at) != c) {
                    System.out.print(prefix);
                    return;
                }
            }
            prefix.append(c);
        }
        System.out.print(prefix);
    }
}`,
      // A different route: sorted, only the first and last word can disagree
      `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String header = reader.readLine();
        int count = (header == null || header.trim().isEmpty()) ? 0 : Integer.parseInt(header.trim());
        String[] words = new String[count];
        for (int i = 0; i < count; i++) words[i] = reader.readLine().trim();
        if (count == 0) { System.out.print(""); return; }
        Arrays.sort(words);
        String first = words[0];
        String last = words[count - 1];
        int shared = 0;
        while (shared < first.length() && shared < last.length()
                && first.charAt(shared) == last.charAt(shared)) {
            shared++;
        }
        System.out.print(first.substring(0, shared));
    }
}`,
    ],
  },

  {
    slug: 'compress-ranges',
    title: 'Compress the Ranges',
    statement: `Collapse runs of consecutive numbers.

**Input** — one line of distinct non-negative integers separated by single
spaces, in no particular order (possibly empty).
**Output** — the numbers in increasing order, with any run of three or more
consecutive values written as \`first-last\`, joined by commas and nothing else.

A run of two stays as two separate numbers. \`1 2 3 5 7 8 9\` gives \`1-3,5,7-9\`.`,
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
	_ = reader
	fmt.Print("")
}
`,
    inputs: [
      { input: '1 2 3 5 7 8 9', sample: true },
      { input: '10 20 30', sample: true },
      { input: '' },
      { input: '1' },
      { input: '3 1 2' },
      { input: '0 1 2 4 5' },
      { input: '5 6 8 9 10 11' },
    ],
    solutions: [
      // Sort, then walk the runs
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
	nums := []int{}
	for {
		var n int
		if _, err := fmt.Fscan(reader, &n); err != nil {
			break
		}
		nums = append(nums, n)
	}
	sort.Ints(nums)
	out := []string{}
	for i := 0; i < len(nums); {
		j := i
		for j+1 < len(nums) && nums[j+1] == nums[j]+1 {
			j++
		}
		if j-i >= 2 {
			out = append(out, strconv.Itoa(nums[i])+"-"+strconv.Itoa(nums[j]))
		} else {
			for k := i; k <= j; k++ {
				out = append(out, strconv.Itoa(nums[k]))
			}
		}
		i = j + 1
	}
	fmt.Print(strings.Join(out, ","))
}`,
      // A different route: a set, asking of each value whether it starts a run
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
	present := map[int]bool{}
	values := []int{}
	for {
		var n int
		if _, err := fmt.Fscan(reader, &n); err != nil {
			break
		}
		present[n] = true
		values = append(values, n)
	}
	sort.Ints(values)
	out := []string{}
	for _, v := range values {
		if present[v-1] {
			continue // not the start of a run
		}
		end := v
		for present[end+1] {
			end++
		}
		if end-v >= 2 {
			out = append(out, strconv.Itoa(v)+"-"+strconv.Itoa(end))
		} else {
			for k := v; k <= end; k++ {
				out = append(out, strconv.Itoa(k))
			}
		}
	}
	fmt.Print(strings.Join(out, ","))
}`,
    ],
  },
];
