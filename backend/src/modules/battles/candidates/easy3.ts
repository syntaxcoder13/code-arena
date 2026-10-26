import { ProblemCandidate } from '../problem-candidate.types';

/** Third batch, easy. */
export const EASY_CANDIDATES_3: ProblemCandidate[] = [
  {
    slug: 'hamming-distance',
    title: 'How Far Apart',
    statement: `Count the positions where two lines differ.

**Input** — two lines of the same length (either may be empty).
**Output** — how many positions hold a different character.`,
    language: 'javascript',
    difficulty: 'easy',
    starterCode: `const input = require('fs').readFileSync(0, 'utf8');

function solve(input) {
  // your code here
}

process.stdout.write(String(solve(input)));
`,
    inputs: [
      { input: 'karolin\nkathrin', sample: true },
      { input: 'abc\nabc', sample: true },
      { input: '\n' },
      { input: 'a\nb' },
      { input: '0000\n1111' },
      { input: '1011101\n1001001' },
      { input: 'xy\nxx' },
    ],
    solutions: [
      // Walk both lines together
      `const lines = require('fs').readFileSync(0, 'utf8').split('\\n');
const a = lines[0] ?? '';
const b = lines[1] ?? '';
let apart = 0;
for (let i = 0; i < a.length; i++) {
  if (a[i] !== b[i]) apart++;
}
process.stdout.write(String(apart));`,
      // A different route: pair the characters up, then count the mismatches
      `const rows = require('fs').readFileSync(0, 'utf8').split('\\n');
const first = rows[0] ?? '';
const second = rows[1] ?? '';
const differing = [...first].filter((ch, index) => ch !== second.charAt(index));
process.stdout.write(String(differing.length));`,
    ],
  },

  {
    slug: 'make-an-acronym',
    title: 'Make an Acronym',
    statement: `Build an acronym from a phrase.

**Input** — one line of words separated by single spaces (possibly empty).
**Output** — the first letter of each word, in upper case, with nothing
between them.

\`portable network graphics\` gives \`PNG\`.`,
    language: 'python',
    difficulty: 'easy',
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: 'portable network graphics', sample: true },
      { input: 'The Quick Brown', sample: true },
      { input: '' },
      { input: 'single' },
      { input: 'a b c d' },
      { input: 'hyper text markup language' },
      { input: 'ruby on rails' },
    ],
    solutions: [
      // First character of every word
      `import sys
words = sys.stdin.read().split()
sys.stdout.write("".join(word[0].upper() for word in words))`,
      // A different route: walk the line, taking a letter after each gap
      `import sys
line = sys.stdin.read().rstrip("\\n")
out = ""
starting = True
for ch in line:
    if ch == " ":
        starting = True
    else:
        if starting:
            out += ch.upper()
        starting = False
sys.stdout.write(out)`,
    ],
  },

  {
    slug: 'collatz-steps',
    title: 'Collatz Steps',
    statement: `Count the steps a number takes to reach one.

**Input** — one integer between 1 and 1000000.
**Output** — how many steps it takes to reach \`1\`, where each step halves an
even number and turns an odd number \`n\` into \`3n + 1\`.

\`1\` is already there, so it takes \`0\` steps.`,
    language: 'python',
    difficulty: 'easy',
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: '6', sample: true },
      { input: '1', sample: true },
      { input: '2' },
      { input: '7' },
      { input: '27' },
      { input: '19' },
      { input: '97' },
    ],
    solutions: [
      // Straight down the chain
      `import sys
n = int(sys.stdin.read().strip())
steps = 0
while n != 1:
    n = n // 2 if n % 2 == 0 else 3 * n + 1
    steps += 1
sys.stdout.write(str(steps))`,
      // A different route: the same chain expressed as recursion, remembered
      `import sys
sys.setrecursionlimit(100000)
known = {1: 0}

def steps(n):
    if n in known:
        return known[n]
    nxt = n // 2 if n % 2 == 0 else 3 * n + 1
    known[n] = steps(nxt) + 1
    return known[n]

sys.stdout.write(str(steps(int(sys.stdin.read().strip()))))`,
    ],
  },

  {
    slug: 'diagonal-sum',
    title: 'Both Diagonals',
    statement: `Add up the two diagonals of a square grid.

**Input** — the first line is \`N\`, then \`N\` lines of \`N\` integers.
**Output** — the total of both diagonals.

Where the diagonals cross, that value is counted once.`,
    language: 'java',
    difficulty: 'easy',
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
      { input: '3\n1 2 3\n4 5 6\n7 8 9', sample: true },
      { input: '2\n1 2\n3 4', sample: true },
      { input: '0' },
      { input: '1\n5' },
      { input: '4\n1 1 1 1\n1 1 1 1\n1 1 1 1\n1 1 1 1' },
      { input: '3\n0 0 0\n0 0 0\n0 0 0' },
      { input: '2\n-1 -2\n-3 -4' },
    ],
    solutions: [
      // Add both diagonals, then take the crossing point back off
      `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int n = scanner.hasNextInt() ? scanner.nextInt() : 0;
        int[][] grid = new int[n][n];
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) grid[r][c] = scanner.nextInt();
        }
        long total = 0;
        for (int i = 0; i < n; i++) {
            total += grid[i][i];
            total += grid[i][n - 1 - i];
        }
        if (n % 2 == 1) total -= grid[n / 2][n / 2];
        System.out.print(total);
    }
}`,
      // A different route: visit every cell and take the ones on a diagonal
      `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int size = scanner.hasNextInt() ? scanner.nextInt() : 0;
        long sum = 0;
        for (int r = 0; r < size; r++) {
            for (int c = 0; c < size; c++) {
                int value = scanner.nextInt();
                if (r == c || r + c == size - 1) sum += value;
            }
        }
        System.out.print(sum);
    }
}`,
    ],
  },

  {
    slug: 'gcd-and-lcm',
    title: 'Greatest and Least',
    statement: `Find what two numbers share and what they both divide.

**Input** — two positive integers on one line, separated by a single space.
**Output** — their greatest common divisor and their least common multiple,
separated by a single space.`,
    language: 'go',
    difficulty: 'easy',
    starterCode: `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	var a, b int
	fmt.Fscan(reader, &a, &b)
	// your code here
}
`,
    inputs: [
      { input: '12 18', sample: true },
      { input: '7 13', sample: true },
      { input: '5 5' },
      { input: '1 1000' },
      { input: '100 75' },
      { input: '2 4' },
      { input: '9 6' },
    ],
    solutions: [
      // Euclid, then the product divided by what they share
      `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	var a, b int
	fmt.Fscan(reader, &a, &b)
	x, y := a, b
	for y != 0 {
		x, y = y, x%y
	}
	fmt.Print(x, " ", a/x*b)
}`,
      // A different route: count down for the divisor, up for the multiple
      `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	var first, second int
	fmt.Fscan(reader, &first, &second)
	smaller := first
	if second < smaller {
		smaller = second
	}
	divisor := 1
	for d := smaller; d >= 1; d-- {
		if first%d == 0 && second%d == 0 {
			divisor = d
			break
		}
	}
	multiple := first
	for multiple%second != 0 {
		multiple += first
	}
	fmt.Print(divisor, " ", multiple)
}`,
    ],
  },
];
