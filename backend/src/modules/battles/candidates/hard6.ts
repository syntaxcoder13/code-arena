import { ProblemCandidate } from '../problem-candidate.types';

/** Sixth batch, hard. */
export const HARD_CANDIDATES_6: ProblemCandidate[] = [
  {
    slug: 'cheapest-network',
    title: 'The Cheapest Network',
    statement: `Join every place together for as little as possible.

**Input** — the first line is \`N\` and \`M\`: how many places and how many
possible links. Places are numbered \`0\` to \`N-1\`. Then \`M\` lines of \`a b w\`:
a link between \`a\` and \`b\` costing \`w\`, which can be used either way.
**Output** — the smallest total cost of a set of links that connects every
place to every other, or \`-1\` if that cannot be done.

One place on its own costs nothing.`,
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
	var n, m int
	fmt.Fscan(reader, &n, &m)
	// your code here
}
`,
    inputs: [
      { input: '4 5\n0 1 1\n1 2 2\n0 2 4\n2 3 1\n0 3 6', sample: true },
      { input: '3 1\n0 1 5', sample: true },
      { input: '1 0' },
      { input: '2 1\n0 1 7' },
      { input: '4 3\n0 1 1\n1 2 1\n2 3 1' },
      { input: '3 3\n0 1 1\n1 2 1\n0 2 1' },
      { input: '5 4\n0 1 2\n1 2 3\n3 4 1\n0 2 1' },
    ],
    solutions: [
      // Cheapest links first, keeping any that joins two separate groups
      `package main

import (
	"bufio"
	"fmt"
	"os"
	"sort"
)

type link struct{ a, b, w int }

var parent []int

func find(x int) int {
	for parent[x] != x {
		parent[x] = parent[parent[x]]
		x = parent[x]
	}
	return x
}

func main() {
	reader := bufio.NewReader(os.Stdin)
	var n, m int
	fmt.Fscan(reader, &n, &m)
	links := make([]link, 0, m)
	for i := 0; i < m; i++ {
		var a, b, w int
		fmt.Fscan(reader, &a, &b, &w)
		links = append(links, link{a, b, w})
	}
	sort.Slice(links, func(i, j int) bool { return links[i].w < links[j].w })
	parent = make([]int, n)
	for i := range parent {
		parent[i] = i
	}
	total, joined := 0, 0
	for _, l := range links {
		ra, rb := find(l.a), find(l.b)
		if ra == rb {
			continue
		}
		parent[ra] = rb
		total += l.w
		joined++
	}
	if joined != n-1 {
		fmt.Print(-1)
		return
	}
	fmt.Print(total)
}`,
      // A different route: grow outwards from one place, always taking the
      // cheapest link that reaches somewhere new
      `package main

import (
	"bufio"
	"fmt"
	"os"
)

const far = 1 << 60

func main() {
	reader := bufio.NewReader(os.Stdin)
	var nodes, edges int
	fmt.Fscan(reader, &nodes, &edges)
	cost := make([][]int, nodes)
	for i := range cost {
		cost[i] = make([]int, nodes)
		for j := range cost[i] {
			cost[i][j] = far
		}
	}
	for i := 0; i < edges; i++ {
		var a, b, w int
		fmt.Fscan(reader, &a, &b, &w)
		if w < cost[a][b] {
			cost[a][b] = w
			cost[b][a] = w
		}
	}
	reached := make([]bool, nodes)
	cheapest := make([]int, nodes)
	for i := range cheapest {
		cheapest[i] = far
	}
	if nodes > 0 {
		cheapest[0] = 0
	}
	total := 0
	for step := 0; step < nodes; step++ {
		next := -1
		for i := 0; i < nodes; i++ {
			if !reached[i] && cheapest[i] < far && (next == -1 || cheapest[i] < cheapest[next]) {
				next = i
			}
		}
		if next == -1 {
			fmt.Print(-1)
			return
		}
		reached[next] = true
		total += cheapest[next]
		for other := 0; other < nodes; other++ {
			if !reached[other] && cost[next][other] < cheapest[other] {
				cheapest[other] = cost[next][other]
			}
		}
	}
	fmt.Print(total)
}`,
    ],
  },

  {
    slug: 'what-fits-in-the-bag',
    title: 'What Fits in the Bag',
    statement: `Choose what to carry when the bag has a limit.

**Input** — the first line is the weight the bag can hold and \`N\`, the number
of items. Then \`N\` lines of \`weight value\`.
**Output** — the largest total value that fits.

Each item may be taken at most once.`,
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
	var capacity, n int
	fmt.Fscan(reader, &capacity, &n)
	// your code here
}
`,
    inputs: [
      { input: '10 4\n5 10\n4 40\n6 30\n3 50', sample: true },
      { input: '7 3\n1 1\n3 4\n4 5', sample: true },
      { input: '0 2\n1 1\n2 2' },
      { input: '5 1\n10 100' },
      { input: '5 1\n5 7' },
      { input: '10 3\n5 10\n5 10\n5 10' },
      { input: '100 2\n50 60\n50 60' },
    ],
    solutions: [
      // The best value for every weight, item by item
      `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	var capacity, n int
	fmt.Fscan(reader, &capacity, &n)
	best := make([]int, capacity+1)
	for i := 0; i < n; i++ {
		var weight, value int
		fmt.Fscan(reader, &weight, &value)
		for room := capacity; room >= weight; room-- {
			if best[room-weight]+value > best[room] {
				best[room] = best[room-weight] + value
			}
		}
	}
	fmt.Print(best[capacity])
}`,
      // A different route: take it or leave it, remembering what was worked
      // out for each item and each amount of room
      `package main

import (
	"bufio"
	"fmt"
	"os"
)

var weights, values []int
var known [][]int
var seen [][]bool

func from(i, room int) int {
	if i == len(weights) {
		return 0
	}
	if seen[i][room] {
		return known[i][room]
	}
	best := from(i+1, room)
	if weights[i] <= room {
		withIt := values[i] + from(i+1, room-weights[i])
		if withIt > best {
			best = withIt
		}
	}
	seen[i][room] = true
	known[i][room] = best
	return best
}

func main() {
	reader := bufio.NewReader(os.Stdin)
	var capacity, n int
	fmt.Fscan(reader, &capacity, &n)
	for i := 0; i < n; i++ {
		var w, v int
		fmt.Fscan(reader, &w, &v)
		weights = append(weights, w)
		values = append(values, v)
	}
	known = make([][]int, n+1)
	seen = make([][]bool, n+1)
	for i := range known {
		known[i] = make([]int, capacity+1)
		seen[i] = make([]bool, capacity+1)
	}
	fmt.Print(from(0, capacity))
}`,
    ],
  },

  {
    slug: 'biggest-block',
    title: 'The Biggest Block',
    statement: `Find the largest solid rectangle on a map.

**Input** — the first line is \`R\` and \`C\`, then \`R\` lines of \`C\` characters,
each \`1\` or \`0\`.
**Output** — the area of the largest rectangle made entirely of \`1\`
characters.

A map with no rows holds nothing, so the answer is \`0\`.`,
    language: 'java',
    difficulty: 'hard',
    timeLimitMs: 3000,
    starterCode: `import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String[] header = reader.readLine().trim().split("\\\\s+");
        int rows = Integer.parseInt(header[0]);
        int cols = Integer.parseInt(header[1]);
        // your code here
    }
}
`,
    inputs: [
      { input: '4 5\n10100\n10111\n11111\n10010', sample: true },
      { input: '2 2\n11\n11', sample: true },
      { input: '0 0' },
      { input: '1 1\n0' },
      { input: '1 1\n1' },
      { input: '3 3\n111\n010\n111' },
      { input: '2 3\n111\n111' },
    ],
    solutions: [
      // Each row read as a skyline, measured with a stack
      `import java.io.*;
import java.util.*;

public class Main {
    static int widestUnder(int[] heights) {
        Deque<Integer> stack = new ArrayDeque<>();
        int best = 0;
        for (int i = 0; i <= heights.length; i++) {
            int here = (i == heights.length) ? 0 : heights[i];
            while (!stack.isEmpty() && heights[stack.peek()] >= here) {
                int top = heights[stack.pop()];
                int left = stack.isEmpty() ? -1 : stack.peek();
                best = Math.max(best, top * (i - left - 1));
            }
            stack.push(i);
        }
        return best;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String[] header = reader.readLine().trim().split("\\\\s+");
        int rows = Integer.parseInt(header[0]);
        int cols = Integer.parseInt(header[1]);
        int[] heights = new int[cols];
        int best = 0;
        for (int r = 0; r < rows; r++) {
            String line = reader.readLine();
            for (int c = 0; c < cols; c++) {
                heights[c] = line.charAt(c) == '1' ? heights[c] + 1 : 0;
            }
            best = Math.max(best, widestUnder(heights));
        }
        System.out.print(best);
    }
}`,
      // A different route: try every rectangle and check it holds
      `import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String[] header = reader.readLine().trim().split("\\\\s+");
        int rows = Integer.parseInt(header[0]);
        int cols = Integer.parseInt(header[1]);
        char[][] grid = new char[rows][];
        for (int r = 0; r < rows; r++) grid[r] = reader.readLine().toCharArray();

        // solid[r][c] counts the ones above and left of that corner
        int[][] solid = new int[rows + 1][cols + 1];
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                solid[r + 1][c + 1] = (grid[r][c] == '1' ? 1 : 0)
                        + solid[r][c + 1] + solid[r + 1][c] - solid[r][c];
            }
        }
        int best = 0;
        for (int top = 0; top < rows; top++) {
            for (int bottom = top; bottom < rows; bottom++) {
                for (int left = 0; left < cols; left++) {
                    for (int right = left; right < cols; right++) {
                        int area = (bottom - top + 1) * (right - left + 1);
                        int ones = solid[bottom + 1][right + 1] - solid[top][right + 1]
                                - solid[bottom + 1][left] + solid[top][left];
                        if (ones == area && area > best) best = area;
                    }
                }
            }
        }
        System.out.print(best);
    }
}`,
    ],
  },

  {
    slug: 'task-cooldown',
    title: 'Tasks With a Cooldown',
    statement: `Work out how long a run of tasks takes when repeats must wait.

**Input** — the first line is the cooldown \`N\`, the second line is the tasks as
single upper case letters separated by single spaces (possibly empty).
**Output** — the least number of time slots needed to run every task.

Each task takes one slot. Two tasks with the same letter must have at least
\`N\` slots between them, which may be filled with other tasks or left idle.`,
    language: 'java',
    difficulty: 'hard',
    timeLimitMs: 3000,
    starterCode: `import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        int cooldown = Integer.parseInt(reader.readLine().trim());
        String line = reader.readLine();
        if (line == null) line = "";
        // your code here
    }
}
`,
    inputs: [
      { input: '2\nA A A B B B', sample: true },
      { input: '0\nA A A B B B', sample: true },
      { input: '2\nA' },
      { input: '2\n' },
      { input: '1\nA A A B B B' },
      { input: '2\nA A A A B C D E' },
      { input: '3\nA A B B' },
    ],
    solutions: [
      // The commonest task sets the shape; everything else fills the gaps
      `import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        int cooldown = Integer.parseInt(reader.readLine().trim());
        String line = reader.readLine();
        if (line == null) line = "";
        int[] counts = new int[26];
        int total = 0;
        for (String part : line.trim().split("\\\\s+")) {
            if (part.isEmpty()) continue;
            counts[part.charAt(0) - 'A']++;
            total++;
        }
        if (total == 0) { System.out.print(0); return; }
        int most = 0;
        for (int c : counts) most = Math.max(most, c);
        // only letters that actually appear, or every unused letter would
        // count as joint commonest
        int atMost = 0;
        for (int c : counts) if (c == most) atMost++;
        int shaped = (most - 1) * (cooldown + 1) + atMost;
        System.out.print(Math.max(total, shaped));
    }
}`,
      // A different route: run the clock, always taking whichever task has
      // most left and is allowed right now
      `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        int cooldown = Integer.parseInt(reader.readLine().trim());
        String line = reader.readLine();
        if (line == null) line = "";
        Map<Character, Integer> left = new HashMap<>();
        for (String part : line.trim().split("\\\\s+")) {
            if (part.isEmpty()) continue;
            left.merge(part.charAt(0), 1, Integer::sum);
        }
        Map<Character, Integer> freeAt = new HashMap<>();
        int remaining = 0;
        for (int v : left.values()) remaining += v;
        int clock = 0;
        while (remaining > 0) {
            clock++;
            Character pick = null;
            for (Map.Entry<Character, Integer> e : left.entrySet()) {
                if (e.getValue() == 0) continue;
                if (freeAt.getOrDefault(e.getKey(), 0) > clock) continue;
                if (pick == null || e.getValue() > left.get(pick)
                        || (e.getValue().equals(left.get(pick)) && e.getKey() < pick)) {
                    pick = e.getKey();
                }
            }
            if (pick == null) continue; // an idle slot
            left.put(pick, left.get(pick) - 1);
            freeAt.put(pick, clock + cooldown + 1);
            remaining--;
        }
        System.out.print(clock);
    }
}`,
    ],
  },

  {
    slug: 'sharing-out-sweets',
    title: 'Sharing Out Sweets',
    statement: `Hand out sweets so nobody beside a lower score gets less.

**Input** — one line of integers separated by single spaces, each a score
(possibly empty).
**Output** — the smallest number of sweets that can be handed out.

Everyone gets at least one sweet, and anyone scoring higher than the person
directly beside them must get more sweets than that person.`,
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
      { input: '1 0 2', sample: true },
      { input: '1 2 2', sample: true },
      { input: '' },
      { input: '5' },
      { input: '1 2 3 4 5' },
      { input: '5 4 3 2 1' },
      { input: '1 3 2 2 1' },
    ],
    solutions: [
      // One pass left to right, then one back the other way
      `const scores = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).filter((t) => t !== '').map(Number);
const sweets = new Array(scores.length).fill(1);
for (let i = 1; i < scores.length; i++) {
  if (scores[i] > scores[i - 1]) sweets[i] = sweets[i - 1] + 1;
}
for (let i = scores.length - 2; i >= 0; i--) {
  if (scores[i] > scores[i + 1]) sweets[i] = Math.max(sweets[i], sweets[i + 1] + 1);
}
process.stdout.write(String(sweets.reduce((a, b) => a + b, 0)));`,
      // A different route: start everyone at one and keep fixing whoever is
      // short, until nothing needs fixing
      `const ratings = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).filter((t) => t !== '').map(Number);
const given = new Array(ratings.length).fill(1);
let changed = true;
while (changed) {
  changed = false;
  for (let i = 0; i < ratings.length; i++) {
    if (i > 0 && ratings[i] > ratings[i - 1] && given[i] <= given[i - 1]) {
      given[i] = given[i - 1] + 1;
      changed = true;
    }
    if (i + 1 < ratings.length && ratings[i] > ratings[i + 1] && given[i] <= given[i + 1]) {
      given[i] = given[i + 1] + 1;
      changed = true;
    }
  }
}
process.stdout.write(String(given.reduce((a, b) => a + b, 0)));`,
    ],
  },

  {
    slug: 'decode-ways',
    title: 'Ways to Read It',
    statement: `Count the ways a run of digits can be read as letters.

**Input** — one line of digits, at least one.
**Output** — how many ways it can be split into numbers from \`1\` to \`26\`,
where each number stands for a letter.

A piece may not start with a \`0\`, so \`06\` cannot be read at all.`,
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
      { input: '12', sample: true },
      { input: '226', sample: true },
      { input: '0' },
      { input: '06' },
      { input: '10' },
      { input: '1111' },
      { input: '27' },
    ],
    solutions: [
      // Ways to reach each position, built from the left
      `const digits = require('fs').readFileSync(0, 'utf8').trim();
const ways = new Array(digits.length + 1).fill(0);
ways[0] = 1;
for (let at = 1; at <= digits.length; at++) {
  if (digits[at - 1] !== '0') ways[at] += ways[at - 1];
  if (at >= 2) {
    const pair = Number(digits.slice(at - 2, at));
    if (digits[at - 2] !== '0' && pair >= 10 && pair <= 26) ways[at] += ways[at - 2];
  }
}
process.stdout.write(String(ways[digits.length]));`,
      // A different route: recursion from each position, remembering answers
      `const text = require('fs').readFileSync(0, 'utf8').trim();
const known = new Map();
function from(at) {
  if (at === text.length) return 1;
  if (text[at] === '0') return 0;
  if (known.has(at)) return known.get(at);
  let total = from(at + 1);
  if (at + 1 < text.length && Number(text.slice(at, at + 2)) <= 26) total += from(at + 2);
  known.set(at, total);
  return total;
}
process.stdout.write(String(from(0)));`,
    ],
  },

  {
    slug: 'palindrome-cuts',
    title: 'Fewest Cuts',
    statement: `Cut a line so every piece reads the same backwards.

**Input** — one line of text (possibly empty).
**Output** — the smallest number of cuts needed so that every piece reads the
same in both directions.

A line that already reads the same backwards needs no cuts.`,
    language: 'python',
    difficulty: 'hard',
    timeLimitMs: 3000,
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: 'aab', sample: true },
      { input: 'aba', sample: true },
      { input: '' },
      { input: 'a' },
      { input: 'abc' },
      { input: 'abccba' },
      { input: 'abacdc' },
    ],
    solutions: [
      // Which stretches read both ways, then the fewest cuts to each point
      `import sys
line = sys.stdin.read().rstrip("\\n")
n = len(line)
if n == 0:
    sys.stdout.write("0")
else:
    same = [[False] * n for _ in range(n)]
    for i in range(n):
        same[i][i] = True
    for width in range(2, n + 1):
        for i in range(n - width + 1):
            j = i + width - 1
            if line[i] == line[j] and (width == 2 or same[i + 1][j - 1]):
                same[i][j] = True
    cuts = [0] * n
    for end in range(n):
        if same[0][end]:
            cuts[end] = 0
            continue
        best = end
        for start in range(1, end + 1):
            if same[start][end] and cuts[start - 1] + 1 < best:
                best = cuts[start - 1] + 1
        cuts[end] = best
    sys.stdout.write(str(cuts[n - 1]))`,
      // A different route: grow outwards from each centre, improving the
      // answer for every stretch that reads both ways
      `import sys
text = sys.stdin.read().rstrip("\\n")
size = len(text)
if size == 0:
    sys.stdout.write("0")
else:
    cuts = [i for i in range(size)]

    def spread(left, right):
        while left >= 0 and right < size and text[left] == text[right]:
            before = 0 if left == 0 else cuts[left - 1] + 1
            if before < cuts[right]:
                cuts[right] = before
            left -= 1
            right += 1

    for centre in range(size):
        spread(centre, centre)
        spread(centre, centre + 1)
    sys.stdout.write(str(cuts[size - 1]))`,
    ],
  },
];
