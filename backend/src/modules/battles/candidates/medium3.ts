import { ProblemCandidate } from '../problem-candidate.types';

/** Third batch, medium. */
export const MEDIUM_CANDIDATES_3: ProblemCandidate[] = [
  {
    slug: 'next-permutation',
    title: 'The Next Arrangement',
    statement: `Find the next arrangement of some numbers in increasing order.

**Input** — one line of integers separated by single spaces (possibly empty).
**Output** — the next arrangement of the same numbers that reads as a larger
sequence, separated by single spaces.

If the numbers are already in their largest arrangement, wrap around to the
smallest one. \`1 2 3\` gives \`1 3 2\`, and \`3 2 1\` gives \`1 2 3\`.`,
    language: 'javascript',
    difficulty: 'medium',
    starterCode: `const input = require('fs').readFileSync(0, 'utf8');

function solve(input) {
  // your code here
}

process.stdout.write(String(solve(input)));
`,
    inputs: [
      { input: '1 2 3', sample: true },
      { input: '3 2 1', sample: true },
      { input: '' },
      { input: '1' },
      { input: '1 1 5' },
      { input: '2 3 1' },
      { input: '1 3 2' },
    ],
    solutions: [
      // Find where the run stops falling, swap, then reverse the tail
      `const nums = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).filter((t) => t !== '').map(Number);
let pivot = nums.length - 2;
while (pivot >= 0 && nums[pivot] >= nums[pivot + 1]) pivot--;
if (pivot >= 0) {
  let swapWith = nums.length - 1;
  while (nums[swapWith] <= nums[pivot]) swapWith--;
  [nums[pivot], nums[swapWith]] = [nums[swapWith], nums[pivot]];
}
const tail = nums.splice(pivot + 1).reverse();
process.stdout.write([...nums, ...tail].join(' '));`,
      // A different route: sort the tail rather than reverse it, and find the
      // successor by scanning it
      `const values = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).filter((t) => t !== '').map(Number);
const n = values.length;
let at = n - 2;
while (at >= 0 && values[at] >= values[at + 1]) at--;
const head = at >= 0 ? values.slice(0, at) : [];
const rest = at >= 0 ? values.slice(at) : values.slice();
if (at >= 0) {
  const target = rest[0];
  const tail = rest.slice(1).sort((x, y) => x - y);
  let pick = 0;
  while (tail[pick] <= target) pick++;
  const chosen = tail.splice(pick, 1)[0];
  tail.push(target);
  tail.sort((x, y) => x - y);
  process.stdout.write([...head, chosen, ...tail].join(' '));
} else {
  process.stdout.write(rest.sort((x, y) => x - y).join(' '));
}`,
    ],
  },

  {
    slug: 'count-islands',
    title: 'Count the Islands',
    statement: `Count the separate patches of land on a map.

**Input** — the first line is \`R\` and \`C\`, then \`R\` lines of \`C\` characters,
each \`1\` for land or \`0\` for water.
**Output** — how many patches of land there are.

Two pieces of land belong to the same patch if they touch side by side, up,
down, left or right. Touching only at a corner is not enough.`,
    language: 'python',
    difficulty: 'medium',
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: '4 5\n11000\n11000\n00100\n00011', sample: true },
      { input: '3 3\n111\n111\n111', sample: true },
      { input: '0 0' },
      { input: '2 2\n00\n00' },
      { input: '3 3\n101\n010\n101' },
      { input: '1 5\n10101' },
      { input: '2 3\n110\n011' },
    ],
    solutions: [
      // Flood fill each patch the first time it is met
      `import sys
lines = [l for l in sys.stdin.read().split("\\n") if l != ""]
if not lines:
    sys.stdout.write("0")
else:
    rows, cols = (int(x) for x in lines[0].split())
    grid = [list(lines[1 + r]) for r in range(rows)]
    found = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != "1":
                continue
            found += 1
            stack = [(r, c)]
            grid[r][c] = "0"
            while stack:
                y, x = stack.pop()
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < rows and 0 <= nx < cols and grid[ny][nx] == "1":
                        grid[ny][nx] = "0"
                        stack.append((ny, nx))
    sys.stdout.write(str(found))`,
      // A different route: join neighbours into groups, then count the groups
      `import sys
rows_in = [l for l in sys.stdin.read().split("\\n") if l != ""]
if not rows_in:
    sys.stdout.write("0")
else:
    height, width = (int(x) for x in rows_in[0].split())
    cells = [rows_in[1 + r] for r in range(height)]
    parent = {}

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    for r in range(height):
        for c in range(width):
            if cells[r][c] == "1":
                parent[(r, c)] = (r, c)
    for r in range(height):
        for c in range(width):
            if cells[r][c] != "1":
                continue
            if r + 1 < height and cells[r + 1][c] == "1":
                union((r, c), (r + 1, c))
            if c + 1 < width and cells[r][c + 1] == "1":
                union((r, c), (r, c + 1))
    sys.stdout.write(str(len({find(cell) for cell in parent})))`,
    ],
  },

  {
    slug: 'rotate-grid',
    title: 'Turn the Grid',
    statement: `Turn a square grid a quarter turn clockwise.

**Input** — the first line is \`N\`, then \`N\` lines of \`N\` integers.
**Output** — the turned grid, \`N\` lines of \`N\` integers separated by single
spaces.

A grid of no rows produces no output.`,
    language: 'python',
    difficulty: 'medium',
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: '3\n1 2 3\n4 5 6\n7 8 9', sample: true },
      { input: '2\n1 2\n3 4', sample: true },
      { input: '0' },
      { input: '1\n7' },
      { input: '4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16' },
      { input: '2\n0 0\n0 1' },
      { input: '3\n1 1 1\n2 2 2\n3 3 3' },
    ],
    solutions: [
      // Read the columns from the bottom up
      `import sys
parts = sys.stdin.read().split()
n = int(parts[0]) if parts else 0
grid = [[parts[1 + r * n + c] for c in range(n)] for r in range(n)]
out = []
for c in range(n):
    out.append(" ".join(grid[n - 1 - r][c] for r in range(n)))
sys.stdout.write("\\n".join(out))`,
      // A different route: flip along the diagonal, then flip left to right
      `import sys
tokens = sys.stdin.read().split()
size = int(tokens[0]) if tokens else 0
cells = [[tokens[1 + r * size + c] for c in range(size)] for r in range(size)]
for r in range(size):
    for c in range(r + 1, size):
        cells[r][c], cells[c][r] = cells[c][r], cells[r][c]
for row in cells:
    row.reverse()
sys.stdout.write("\\n".join(" ".join(row) for row in cells))`,
    ],
  },

  {
    slug: 'fewest-coins',
    title: 'Fewest Coins',
    statement: `Make up an amount with as few coins as possible.

**Input** — the first line is the amount, the second line is the coin values
separated by single spaces. Each coin may be used any number of times.
**Output** — the smallest number of coins that makes the amount exactly, or
\`-1\` if it cannot be made.

An amount of \`0\` needs no coins.`,
    language: 'java',
    difficulty: 'medium',
    starterCode: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        int amount = Integer.parseInt(reader.readLine().trim());
        // your code here
    }
}
`,
    inputs: [
      { input: '11\n1 2 5', sample: true },
      { input: '3\n2', sample: true },
      { input: '0\n1 2 5' },
      { input: '7\n1' },
      { input: '30\n25 10 5' },
      { input: '6\n1 3 4' },
      { input: '99\n7 11' },
    ],
    solutions: [
      // Build up the cheapest way to reach every amount below the target
      `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        int amount = Integer.parseInt(reader.readLine().trim());
        String coinLine = reader.readLine();
        List<Integer> coins = new ArrayList<>();
        if (coinLine != null) {
            for (String part : coinLine.trim().split("\\\\s+")) {
                if (!part.isEmpty()) coins.add(Integer.parseInt(part));
            }
        }
        int[] fewest = new int[amount + 1];
        Arrays.fill(fewest, Integer.MAX_VALUE);
        fewest[0] = 0;
        for (int target = 1; target <= amount; target++) {
            for (int coin : coins) {
                if (coin <= target && fewest[target - coin] != Integer.MAX_VALUE) {
                    fewest[target] = Math.min(fewest[target], fewest[target - coin] + 1);
                }
            }
        }
        System.out.print(fewest[amount] == Integer.MAX_VALUE ? -1 : fewest[amount]);
    }
}`,
      // A different route: spread outwards a coin at a time, taking the first
      // moment the amount is reached
      `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        int target = Integer.parseInt(reader.readLine().trim());
        String line = reader.readLine();
        List<Integer> coins = new ArrayList<>();
        if (line != null) {
            for (String part : line.trim().split("\\\\s+")) {
                if (!part.isEmpty()) coins.add(Integer.parseInt(part));
            }
        }
        boolean[] seen = new boolean[target + 1];
        Deque<Integer> queue = new ArrayDeque<>();
        queue.add(0);
        seen[0] = true;
        int used = 0;
        while (!queue.isEmpty()) {
            int size = queue.size();
            for (int i = 0; i < size; i++) {
                int here = queue.poll();
                if (here == target) {
                    System.out.print(used);
                    return;
                }
                for (int coin : coins) {
                    int next = here + coin;
                    if (next <= target && !seen[next]) {
                        seen[next] = true;
                        queue.add(next);
                    }
                }
            }
            used++;
        }
        System.out.print(-1);
    }
}`,
    ],
  },

  {
    slug: 'best-run',
    title: 'The Best Run',
    statement: `Find the stretch of numbers that adds up to the most.

**Input** — one line of integers separated by single spaces (possibly empty).
**Output** — the largest total of any run of one or more neighbouring numbers.

Print \`0\` if there are no numbers at all. Every number may be negative, and
at least one must be taken.`,
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
      { input: '-2 1 -3 4 -1 2 1 -5 4', sample: true },
      { input: '-3 -1 -2', sample: true },
      { input: '' },
      { input: '5' },
      { input: '1 2 3 4' },
      { input: '-1 4 -1 4 -1' },
      { input: '2 -1 2 -1 2' },
    ],
    solutions: [
      // Carry the best run ending here, restarting when it turns negative
      `package main

import (
	"bufio"
	"fmt"
	"os"
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
	if len(nums) == 0 {
		fmt.Print(0)
		return
	}
	best := nums[0]
	here := nums[0]
	for i := 1; i < len(nums); i++ {
		if here < 0 {
			here = 0
		}
		here += nums[i]
		if here > best {
			best = here
		}
	}
	fmt.Print(best)
}`,
      // A different route: running totals, and the smallest one seen before
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
	if len(values) == 0 {
		fmt.Print(0)
		return
	}
	running := 0
	smallestBefore := 0
	best := values[0]
	for i, v := range values {
		running += v
		if i == 0 || running-smallestBefore > best {
			if running-smallestBefore > best {
				best = running - smallestBefore
			}
		}
		if running < smallestBefore {
			smallestBefore = running
		}
	}
	fmt.Print(best)
}`,
    ],
  },
];
