import { ProblemCandidate } from '../problem-candidate.types';

/** Sixth batch, medium. */
export const MEDIUM_CANDIDATES_6: ProblemCandidate[] = [
  {
    slug: 'pairs-that-total',
    title: 'Pairs That Total K',
    statement: `Count the pairs of numbers that add up to a given total.

**Input** — the first line is \`K\`, the second line is integers separated by
single spaces (possibly empty).
**Output** — how many pairs of positions hold two numbers adding up to \`K\`.

Each position may be paired with any other, and a pair is counted once
whichever way round it is read.`,
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
      { input: '5\n1 2 3 4', sample: true },
      { input: '4\n2 2 2', sample: true },
      { input: '0\n' },
      { input: '10\n1 2 3' },
      { input: '6\n3 3 3 3' },
      { input: '-1\n0 -1 1 -2' },
      { input: '7\n7 0' },
    ],
    solutions: [
      // Count what has been seen, and ask for the partner of each value
      `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	var k int
	fmt.Fscan(reader, &k)
	seen := map[int]int{}
	pairs := 0
	for {
		var n int
		if _, err := fmt.Fscan(reader, &n); err != nil {
			break
		}
		pairs += seen[k-n]
		seen[n]++
	}
	fmt.Print(pairs)
}`,
      // A different route: look at every pair of positions
      `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	var target int
	fmt.Fscan(reader, &target)
	values := []int{}
	for {
		var n int
		if _, err := fmt.Fscan(reader, &n); err != nil {
			break
		}
		values = append(values, n)
	}
	found := 0
	for i := 0; i < len(values); i++ {
		for j := i + 1; j < len(values); j++ {
			if values[i]+values[j] == target {
				found++
			}
		}
	}
	fmt.Print(found)
}`,
    ],
  },

  {
    slug: 'k-largest',
    title: 'The K Largest',
    statement: `Report the largest few numbers.

**Input** — the first line is \`K\`, the second line is integers separated by
single spaces (possibly empty).
**Output** — the \`K\` largest values, biggest first, separated by single
spaces.

Repeats count separately. If there are fewer than \`K\` numbers, print all of
them.`,
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
      { input: '2\n3 1 4 1 5', sample: true },
      { input: '3\n1 2', sample: true },
      { input: '0\n1 2 3' },
      { input: '1\n7' },
      { input: '4\n5 5 5 5' },
      { input: '2\n-1 -2 -3' },
      { input: '3\n9 1 8 2 7' },
    ],
    solutions: [
      // Sort the lot, then take from the top
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
	sort.Sort(sort.Reverse(sort.IntSlice(nums)))
	if k > len(nums) {
		k = len(nums)
	}
	out := make([]string, 0, k)
	for i := 0; i < k; i++ {
		out = append(out, strconv.Itoa(nums[i]))
	}
	fmt.Print(strings.Join(out, " "))
}`,
      // A different route: pull out the largest, K times over
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
	var wanted int
	fmt.Fscan(reader, &wanted)
	values := []int{}
	for {
		var n int
		if _, err := fmt.Fscan(reader, &n); err != nil {
			break
		}
		values = append(values, n)
	}
	out := []string{}
	for taken := 0; taken < wanted && len(values) > 0; taken++ {
		best := 0
		for i := range values {
			if values[i] > values[best] {
				best = i
			}
		}
		out = append(out, strconv.Itoa(values[best]))
		values = append(values[:best], values[best+1:]...)
	}
	fmt.Print(strings.Join(out, " "))
}`,
    ],
  },

  {
    slug: 'zero-the-crosses',
    title: 'Zero the Crosses',
    statement: `Wipe out the row and column of every zero.

**Input** — the first line is \`R\` and \`C\`, then \`R\` lines of \`C\` integers.
**Output** — the grid after every row and column holding a zero has been
filled with zeros, \`R\` lines of \`C\` integers separated by single spaces.

The zeros are found in the grid as it arrives; a zero written during the wipe
does not cause further wiping.`,
    language: 'java',
    difficulty: 'medium',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int rows = scanner.hasNextInt() ? scanner.nextInt() : 0;
        int cols = scanner.hasNextInt() ? scanner.nextInt() : 0;
        // your code here
    }
}
`,
    inputs: [
      { input: '3 3\n1 1 1\n1 0 1\n1 1 1', sample: true },
      { input: '2 2\n0 1\n1 1', sample: true },
      { input: '0 0' },
      { input: '1 1\n5' },
      { input: '2 3\n1 2 3\n4 5 6' },
      { input: '2 2\n0 0\n0 0' },
      { input: '3 2\n1 2\n0 4\n5 6' },
    ],
    solutions: [
      // Note which rows and columns are doomed, then write the answer
      `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int rows = scanner.hasNextInt() ? scanner.nextInt() : 0;
        int cols = scanner.hasNextInt() ? scanner.nextInt() : 0;
        int[][] grid = new int[rows][cols];
        boolean[] deadRow = new boolean[rows];
        boolean[] deadCol = new boolean[cols];
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                grid[r][c] = scanner.nextInt();
                if (grid[r][c] == 0) {
                    deadRow[r] = true;
                    deadCol[c] = true;
                }
            }
        }
        StringBuilder out = new StringBuilder();
        for (int r = 0; r < rows; r++) {
            if (r > 0) out.append('\\n');
            for (int c = 0; c < cols; c++) {
                if (c > 0) out.append(' ');
                out.append(deadRow[r] || deadCol[c] ? 0 : grid[r][c]);
            }
        }
        System.out.print(out);
    }
}`,
      // A different route: keep the original untouched and build a copy,
      // asking the original about each row and column
      `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int rows = scanner.hasNextInt() ? scanner.nextInt() : 0;
        int cols = scanner.hasNextInt() ? scanner.nextInt() : 0;
        int[][] original = new int[rows][cols];
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) original[r][c] = scanner.nextInt();
        }
        StringBuilder out = new StringBuilder();
        for (int r = 0; r < rows; r++) {
            if (r > 0) out.append('\\n');
            for (int c = 0; c < cols; c++) {
                boolean wipe = false;
                for (int x = 0; x < cols && !wipe; x++) if (original[r][x] == 0) wipe = true;
                for (int y = 0; y < rows && !wipe; y++) if (original[y][c] == 0) wipe = true;
                if (c > 0) out.append(' ');
                out.append(wipe ? 0 : original[r][c]);
            }
        }
        System.out.print(out);
    }
}`,
    ],
  },

  {
    slug: 'number-to-roman',
    title: 'Write It in Roman',
    statement: `Write a number the Roman way.

**Input** — one integer between 1 and 3999.
**Output** — the same number as a Roman numeral in upper case.

The subtractive pairs are \`IV\`, \`IX\`, \`XL\`, \`XC\`, \`CD\` and \`CM\`.`,
    language: 'java',
    difficulty: 'medium',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int n = scanner.nextInt();
        // your code here
    }
}
`,
    inputs: [
      { input: '14', sample: true },
      { input: '1994', sample: true },
      { input: '1' },
      { input: '3999' },
      { input: '40' },
      { input: '58' },
      { input: '444' },
    ],
    solutions: [
      // Take the largest piece that fits, over and over
      `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int n = scanner.nextInt();
        int[] amounts = {1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1};
        String[] letters = {"M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"};
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < amounts.length; i++) {
            while (n >= amounts[i]) {
                out.append(letters[i]);
                n -= amounts[i];
            }
        }
        System.out.print(out);
    }
}`,
      // A different route: one digit at a time, each with its own three
      // letters to draw on
      `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int n = scanner.nextInt();
        String[] thousands = {"", "M", "MM", "MMM"};
        String[] hundreds = {"", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM"};
        String[] tens = {"", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC"};
        String[] ones = {"", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"};
        System.out.print(
            thousands[n / 1000] + hundreds[(n / 100) % 10] + tens[(n / 10) % 10] + ones[n % 10]
        );
    }
}`,
    ],
  },

  {
    slug: 'chunk-sums',
    title: 'Sum Each Chunk',
    statement: `Add up the numbers in fixed sized groups.

**Input** — the first line is \`K\`, the second line is integers separated by
single spaces (possibly empty).
**Output** — the total of the first \`K\` numbers, then the next \`K\`, and so on,
separated by single spaces.

The last group may hold fewer than \`K\`.`,
    language: 'javascript',
    difficulty: 'medium',
    starterCode: `const input = require('fs').readFileSync(0, 'utf8');

function solve(input) {
  // your code here
}

process.stdout.write(String(solve(input)));
`,
    inputs: [
      { input: '2\n1 2 3 4 5', sample: true },
      { input: '3\n1 2 3', sample: true },
      { input: '1\n4 5' },
      { input: '5\n1 2' },
      { input: '2\n' },
      { input: '4\n1 1 1 1 1 1 1 1' },
      { input: '3\n-1 -2 -3 -4' },
    ],
    solutions: [
      // Step forward K at a time
      `const lines = require('fs').readFileSync(0, 'utf8').split('\\n');
const k = Number(lines[0] ?? 0);
const nums = (lines[1] ?? '').trim().split(/\\s+/).filter((t) => t !== '').map(Number);
const out = [];
for (let at = 0; at < nums.length; at += k) {
  let total = 0;
  for (let i = at; i < Math.min(at + k, nums.length); i++) total += nums[i];
  out.push(total);
}
process.stdout.write(out.join(' '));`,
      // A different route: add each number into the group it belongs to
      `const rows = require('fs').readFileSync(0, 'utf8').split('\\n');
const size = Number(rows[0] ?? 0);
const values = (rows[1] ?? '').trim().split(/\\s+/).filter((t) => t !== '').map(Number);
const totals = [];
values.forEach((value, index) => {
  const group = Math.floor(index / size);
  totals[group] = (totals[group] ?? 0) + value;
});
process.stdout.write(totals.join(' '));`,
    ],
  },

  {
    slug: 'longest-alternating',
    title: 'Odd, Even, Odd',
    statement: `Find the longest stretch where odd and even take turns.

**Input** — one line of integers separated by single spaces (possibly empty).
**Output** — the length of the longest run of neighbouring numbers in which
each is odd whenever the one before it is even, and even whenever the one
before it is odd.

A single number is a run of length one.`,
    language: 'javascript',
    difficulty: 'medium',
    starterCode: `const input = require('fs').readFileSync(0, 'utf8');

function solve(input) {
  // your code here
}

process.stdout.write(String(solve(input)));
`,
    inputs: [
      { input: '1 2 3 4 5', sample: true },
      { input: '2 4 6', sample: true },
      { input: '' },
      { input: '1' },
      { input: '1 3 2 4' },
      { input: '1 2 2 3 4' },
      { input: '7 8 9 10 11 12' },
    ],
    solutions: [
      // Carry the run ending here, restarting when two share a parity
      `const nums = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).filter((t) => t !== '').map(Number);
let best = 0;
let run = 0;
for (let i = 0; i < nums.length; i++) {
  if (i > 0 && Math.abs(nums[i] % 2) !== Math.abs(nums[i - 1] % 2)) run++;
  else run = 1;
  if (run > best) best = run;
}
process.stdout.write(String(best));`,
      // A different route: cut the list where the turn-taking breaks, then
      // take the longest piece
      `const values = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).filter((t) => t !== '').map(Number);
const parity = (n) => ((n % 2) + 2) % 2;
const pieces = [];
let piece = [];
for (let i = 0; i < values.length; i++) {
  if (i > 0 && parity(values[i]) === parity(values[i - 1])) {
    pieces.push(piece);
    piece = [];
  }
  piece.push(values[i]);
}
if (piece.length > 0) pieces.push(piece);
process.stdout.write(String(pieces.reduce((best, p) => Math.max(best, p.length), 0)));`,
    ],
  },

  {
    slug: 'frequency-sort',
    title: 'Commonest First',
    statement: `Reorder a line so the commonest characters come first.

**Input** — one line of characters with no spaces (possibly empty).
**Output** — the same characters, grouped so that every copy of one character
sits together, with the commonest group first.

Characters appearing the same number of times are grouped in the order their
codes run, so upper case comes before lower case.`,
    language: 'python',
    difficulty: 'medium',
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: 'tree', sample: true },
      { input: 'cccaaa', sample: true },
      { input: '' },
      { input: 'a' },
      { input: 'aabbcc' },
      { input: 'Aabb' },
      { input: 'mississippi' },
    ],
    solutions: [
      // Count, then sort on the count and the character
      `import sys
from collections import Counter
line = sys.stdin.read().strip()
counts = Counter(line)
order = sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))
sys.stdout.write("".join(ch * n for ch, n in order))`,
      // A different route: counted by hand, then placed one group at a time
      `import sys
text = sys.stdin.read().strip()
counts = {}
for ch in text:
    counts[ch] = counts.get(ch, 0) + 1
remaining = dict(counts)
out = ""
while remaining:
    best = None
    for ch in remaining:
        if best is None or remaining[ch] > remaining[best] or (
            remaining[ch] == remaining[best] and ch < best
        ):
            best = ch
    out += best * remaining[best]
    del remaining[best]
sys.stdout.write(out)`,
    ],
  },
];
