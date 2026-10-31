import { ProblemCandidate } from '../problem-candidate.types';

/** Second batch, hard. */
export const HARD_CANDIDATES_2: ProblemCandidate[] = [
  {
    slug: 'sliding-window-max',
    title: 'Sliding Window Maximum',
    statement: `Report the largest value in every window of a fixed width.

**Input** — the first line is \`K\`, the second line is integers separated by
single spaces.
**Output** — the maximum of each window of \`K\` consecutive values, left to
right, separated by single spaces.

Print nothing if there are fewer than \`K\` numbers.`,
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
      { input: '3\n1 3 -1 -3 5 3 6 7', sample: true },
      { input: '1\n4 2', sample: true },
      { input: '2\n1 1 1' },
      { input: '5\n1 2 3 4 5' },
      { input: '3\n9 8 7 6' },
      { input: '2\n-1 -2 -3' },
      { input: '4\n1 2 3' },
    ],
    solutions: [
      // A deque holding only the values that could still win
      `const tokens = require('fs').readFileSync(0, 'utf8').split(/\\s+/).filter((t) => t !== '');
const k = Number(tokens[0] ?? 0);
const nums = tokens.slice(1).map(Number);
const window = [];
const out = [];
for (let i = 0; i < nums.length; i++) {
  while (window.length && window[0] <= i - k) window.shift();
  while (window.length && nums[window[window.length - 1]] <= nums[i]) window.pop();
  window.push(i);
  if (i >= k - 1) out.push(nums[window[0]]);
}
process.stdout.write(out.join(' '));`,
      // A different route: look at every window and take its largest
      `const parts = require('fs').readFileSync(0, 'utf8').split(/\\s+/).filter((p) => p !== '');
const width = Number(parts[0] ?? 0);
const values = parts.slice(1).map(Number);
const answers = [];
for (let start = 0; start + width <= values.length; start++) {
  let best = values[start];
  for (let at = start + 1; at < start + width; at++) {
    if (values[at] > best) best = values[at];
  }
  answers.push(best);
}
process.stdout.write(answers.join(' '));`,
    ],
  },

  {
    slug: 'word-ladder',
    title: 'Word Ladder',
    statement: `Count the steps from one word to another, changing one letter at a time.

**Input** — the first line is \`start\` and \`end\`, the second line is \`N\`, then
\`N\` lines of words. Every word is the same length and lower case.
**Output** — how many words are in the shortest chain from \`start\` to \`end\`,
counting both ends. Every word after the first must appear in the list, and
each step changes exactly one letter.

Print \`0\` if no chain exists. If \`start\` and \`end\` are the same word, the
answer is \`1\`.`,
    language: 'python',
    difficulty: 'hard',
    timeLimitMs: 3000,
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: 'hit cog\n6\nhot\ndot\ndog\nlot\nlog\ncog', sample: true },
      { input: 'hit cog\n5\nhot\ndot\ndog\nlot\nlog', sample: true },
      { input: 'a c\n2\nb\nc' },
      { input: 'abc abc\n0' },
      { input: 'cat dog\n3\ncot\ncog\ndog' },
      { input: 'aa bb\n2\nab\nbb' },
      { input: 'xy zz\n1\nzz' },
    ],
    solutions: [
      // Breadth first from the start, one letter at a time
      `import sys
from collections import deque

lines = sys.stdin.read().split("\\n")
start, end = lines[0].split()
count = int(lines[1]) if len(lines) > 1 and lines[1].strip() else 0
words = set(lines[2 + i].strip() for i in range(count))

if start == end:
    sys.stdout.write("1")
else:
    queue = deque([(start, 1)])
    seen = {start}
    answer = 0
    while queue:
        word, steps = queue.popleft()
        if word == end:
            answer = steps
            break
        for i in range(len(word)):
            for c in "abcdefghijklmnopqrstuvwxyz":
                nxt = word[:i] + c + word[i + 1:]
                if nxt in words and nxt not in seen:
                    seen.add(nxt)
                    queue.append((nxt, steps + 1))
    sys.stdout.write(str(answer))`,
      // A different route: relax distances over the whole set until settled
      `import sys

rows = sys.stdin.read().split("\\n")
first, last = rows[0].split()
total = int(rows[1]) if len(rows) > 1 and rows[1].strip() else 0
pool = [rows[2 + i].strip() for i in range(total)]

def differs_by_one(a, b):
    if len(a) != len(b):
        return False
    return sum(1 for x, y in zip(a, b) if x != y) == 1

if first == last:
    sys.stdout.write("1")
else:
    nodes = [first] + [w for w in pool if w != first]
    distance = {w: 0 for w in nodes}
    for w in nodes:
        distance[w] = 10 ** 9
    distance[first] = 1
    for _ in range(len(nodes)):
        changed = False
        for a in nodes:
            if distance[a] == 10 ** 9:
                continue
            for b in pool:
                if differs_by_one(a, b) and distance[a] + 1 < distance.get(b, 10 ** 9):
                    distance[b] = distance[a] + 1
                    changed = True
        if not changed:
            break
    found = distance.get(last, 10 ** 9)
    sys.stdout.write("0" if found >= 10 ** 9 else str(found))`,
    ],
  },

  {
    slug: 'queens-count',
    title: 'Counting Queens',
    statement: `Count the ways to place queens so none can take another.

**Input** — one integer \`N\` between 1 and 8.
**Output** — the number of ways \`N\` queens fit on an \`N\` by \`N\` board with no
two sharing a row, a column or a diagonal.`,
    language: 'python',
    difficulty: 'hard',
    timeLimitMs: 3000,
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: '4', sample: true },
      { input: '1', sample: true },
      { input: '2' },
      { input: '3' },
      { input: '5' },
      { input: '6' },
      { input: '8' },
    ],
    solutions: [
      // Backtracking, remembering which columns and diagonals are taken
      `import sys
n = int(sys.stdin.read().strip())
columns = set()
rising = set()
falling = set()
found = 0

def place(row):
    global found
    if row == n:
        found += 1
        return
    for col in range(n):
        if col in columns or (row - col) in rising or (row + col) in falling:
            continue
        columns.add(col)
        rising.add(row - col)
        falling.add(row + col)
        place(row + 1)
        columns.remove(col)
        rising.remove(row - col)
        falling.remove(row + col)

place(0)
sys.stdout.write(str(found))`,
      // A different route: the same search carried in three bitmasks
      `import sys
size = int(sys.stdin.read().strip())
full = (1 << size) - 1

def search(cols, left, right):
    if cols == full:
        return 1
    total = 0
    free = ~(cols | left | right) & full
    while free:
        bit = free & -free
        free -= bit
        total += search(cols | bit, (left | bit) << 1 & full, (right | bit) >> 1)
    return total

sys.stdout.write(str(search(0, 0, 0)))`,
    ],
  },

  {
    slug: 'trapped-water',
    title: 'Trapped Water',
    statement: `Work out how much rain the gaps in a skyline hold.

**Input** — one line of non-negative integers separated by single spaces, each
the height of a bar one unit wide (possibly empty).
**Output** — the units of water held between the bars once the rain stops.

\`0 1 0 2 1 0 1 3 2 1 2 1\` holds \`6\`.`,
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
      { input: '0 1 0 2 1 0 1 3 2 1 2 1', sample: true },
      { input: '4 2 0 3 2 5', sample: true },
      { input: '1 2 3' },
      { input: '5' },
      { input: '2 0 2' },
      { input: '3 0 1 0 3' },
      { input: '1 0 1 0 1' },
    ],
    solutions: [
      // Two pointers, each side held up by the tallest bar behind it
      `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        List<Integer> bars = new ArrayList<>();
        while (scanner.hasNextInt()) bars.add(scanner.nextInt());
        int left = 0;
        int right = bars.size() - 1;
        int leftMax = 0;
        int rightMax = 0;
        long held = 0;
        while (left < right) {
            if (bars.get(left) < bars.get(right)) {
                leftMax = Math.max(leftMax, bars.get(left));
                held += leftMax - bars.get(left);
                left++;
            } else {
                rightMax = Math.max(rightMax, bars.get(right));
                held += rightMax - bars.get(right);
                right--;
            }
        }
        System.out.print(held);
    }
}`,
      // A different route: the tallest bar to each side, worked out up front
      `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        List<Integer> heights = new ArrayList<>();
        while (scanner.hasNextInt()) heights.add(scanner.nextInt());
        int n = heights.size();
        if (n == 0) { System.out.print(0); return; }
        int[] tallestLeft = new int[n];
        int[] tallestRight = new int[n];
        tallestLeft[0] = heights.get(0);
        for (int i = 1; i < n; i++) tallestLeft[i] = Math.max(tallestLeft[i - 1], heights.get(i));
        tallestRight[n - 1] = heights.get(n - 1);
        for (int i = n - 2; i >= 0; i--) tallestRight[i] = Math.max(tallestRight[i + 1], heights.get(i));
        long total = 0;
        for (int i = 0; i < n; i++) {
            total += Math.min(tallestLeft[i], tallestRight[i]) - heights.get(i);
        }
        System.out.print(total);
    }
}`,
    ],
  },

  {
    slug: 'shortest-paths',
    title: 'Shortest Paths',
    statement: `Measure the distance from one place to every other.

**Input** — the first line is \`N\`, \`M\` and \`S\`: how many nodes, how many edges,
and which node to start from. Nodes are numbered \`0\` to \`N-1\`. Then \`M\` lines
of \`a b w\`: an edge between \`a\` and \`b\` that can be walked either way, costing
\`w\` (a non-negative integer).
**Output** — \`N\` numbers separated by single spaces: the cheapest total cost
from \`S\` to each node in turn. Print \`-1\` for a node that cannot be reached.`,
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
      { input: '4 4 0\n0 1 1\n1 2 2\n0 2 4\n2 3 1', sample: true },
      { input: '3 1 0\n0 1 5', sample: true },
      { input: '1 0 0' },
      { input: '5 4 0\n0 1 1\n1 2 1\n2 3 1\n3 4 1' },
      { input: '4 2 2\n0 1 3\n2 3 7' },
      { input: '3 3 1\n0 1 2\n1 2 2\n0 2 10' },
      { input: '2 1 0\n0 1 0' },
    ],
    solutions: [
      // Always settle the nearest unsettled node next
      `package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

const far = 1 << 60

func main() {
	reader := bufio.NewReader(os.Stdin)
	var n, m, source int
	fmt.Fscan(reader, &n, &m, &source)
	cost := make([][]int, n)
	for i := range cost {
		cost[i] = make([]int, n)
		for j := range cost[i] {
			cost[i][j] = far
		}
	}
	for i := 0; i < m; i++ {
		var a, b, w int
		fmt.Fscan(reader, &a, &b, &w)
		if w < cost[a][b] {
			cost[a][b] = w
			cost[b][a] = w
		}
	}
	distance := make([]int, n)
	settled := make([]bool, n)
	for i := range distance {
		distance[i] = far
	}
	distance[source] = 0
	for step := 0; step < n; step++ {
		nearest := -1
		for i := 0; i < n; i++ {
			if !settled[i] && distance[i] < far && (nearest == -1 || distance[i] < distance[nearest]) {
				nearest = i
			}
		}
		if nearest == -1 {
			break
		}
		settled[nearest] = true
		for next := 0; next < n; next++ {
			if cost[nearest][next] < far && distance[nearest]+cost[nearest][next] < distance[next] {
				distance[next] = distance[nearest] + cost[nearest][next]
			}
		}
	}
	out := make([]string, n)
	for i, d := range distance {
		if d >= far {
			out[i] = "-1"
		} else {
			out[i] = strconv.Itoa(d)
		}
	}
	fmt.Print(strings.Join(out, " "))
}`,
      // A different route: relax every edge over and over until nothing moves
      `package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

type edge struct{ a, b, w int }

func main() {
	reader := bufio.NewReader(os.Stdin)
	var nodes, edges, from int
	fmt.Fscan(reader, &nodes, &edges, &from)
	list := make([]edge, 0, edges)
	for i := 0; i < edges; i++ {
		var a, b, w int
		fmt.Fscan(reader, &a, &b, &w)
		list = append(list, edge{a, b, w})
	}
	const unreachable = 1 << 60
	distance := make([]int, nodes)
	for i := range distance {
		distance[i] = unreachable
	}
	distance[from] = 0
	for round := 0; round < nodes; round++ {
		moved := false
		for _, e := range list {
			if distance[e.a] < unreachable && distance[e.a]+e.w < distance[e.b] {
				distance[e.b] = distance[e.a] + e.w
				moved = true
			}
			if distance[e.b] < unreachable && distance[e.b]+e.w < distance[e.a] {
				distance[e.a] = distance[e.b] + e.w
				moved = true
			}
		}
		if !moved {
			break
		}
	}
	out := make([]string, nodes)
	for i, d := range distance {
		if d >= unreachable {
			out[i] = "-1"
		} else {
			out[i] = strconv.Itoa(d)
		}
	}
	fmt.Print(strings.Join(out, " "))
}`,
    ],
  },
];
