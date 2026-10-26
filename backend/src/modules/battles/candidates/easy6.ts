import { ProblemCandidate } from '../problem-candidate.types';

/**
 * Sixth batch, easy.
 *
 * Weighted towards Go and Java, which were the thinnest pools.
 */
export const EASY_CANDIDATES_6: ProblemCandidate[] = [
  {
    slug: 'sum-of-multiples',
    title: 'Threes and Fives',
    statement: `Add up the numbers that divide by three or five.

**Input** — one integer \`N\`, zero or more.
**Output** — the total of every positive integer below \`N\` that divides
exactly by \`3\` or by \`5\`.

Below \`10\` those are \`3\`, \`5\`, \`6\` and \`9\`.`,
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
	var n int
	fmt.Fscan(reader, &n)
	// your code here
}
`,
    inputs: [
      { input: '10', sample: true },
      { input: '3', sample: true },
      { input: '0' },
      { input: '1' },
      { input: '16' },
      { input: '20' },
      { input: '100' },
    ],
    solutions: [
      // Look at every number below N
      `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	var n int
	fmt.Fscan(reader, &n)
	total := 0
	for i := 1; i < n; i++ {
		if i%3 == 0 || i%5 == 0 {
			total += i
		}
	}
	fmt.Print(total)
}`,
      // A different route: add the threes and the fives, then take back the
      // fifteens, which were counted twice
      `package main

import (
	"bufio"
	"fmt"
	"os"
)

func sumOfStep(step, below int) int {
	last := (below - 1) / step
	return step * last * (last + 1) / 2
}

func main() {
	reader := bufio.NewReader(os.Stdin)
	var n int
	fmt.Fscan(reader, &n)
	if n < 1 {
		fmt.Print(0)
		return
	}
	fmt.Print(sumOfStep(3, n) + sumOfStep(5, n) - sumOfStep(15, n))
}`,
    ],
  },

  {
    slug: 'count-primes',
    title: 'How Many Primes',
    statement: `Count the primes below a number.

**Input** — one integer \`N\` between 0 and 10000.
**Output** — how many prime numbers are strictly less than \`N\`.

\`1\` is not prime.`,
    language: 'go',
    difficulty: 'easy',
    timeLimitMs: 3000,
    starterCode: `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	var n int
	fmt.Fscan(reader, &n)
	// your code here
}
`,
    inputs: [
      { input: '10', sample: true },
      { input: '2', sample: true },
      { input: '0' },
      { input: '3' },
      { input: '100' },
      { input: '1000' },
      { input: '10000' },
    ],
    solutions: [
      // Cross out the multiples of each prime as it is found
      `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	var n int
	fmt.Fscan(reader, &n)
	if n < 3 {
		fmt.Print(0)
		return
	}
	composite := make([]bool, n)
	found := 0
	for i := 2; i < n; i++ {
		if composite[i] {
			continue
		}
		found++
		for j := i * i; j < n; j += i {
			composite[j] = true
		}
	}
	fmt.Print(found)
}`,
      // A different route: try dividing each number in turn
      `package main

import (
	"bufio"
	"fmt"
	"os"
)

func isPrime(n int) bool {
	if n < 2 {
		return false
	}
	for d := 2; d*d <= n; d++ {
		if n%d == 0 {
			return false
		}
	}
	return true
}

func main() {
	reader := bufio.NewReader(os.Stdin)
	var limit int
	fmt.Fscan(reader, &limit)
	count := 0
	for i := 2; i < limit; i++ {
		if isPrime(i) {
			count++
		}
	}
	fmt.Print(count)
}`,
    ],
  },

  {
    slug: 'leap-years',
    title: 'Counting Leap Years',
    statement: `Count the leap years in a span.

**Input** — two years on one line, separated by a single space. The first is
not after the second.
**Output** — how many leap years fall between them, counting both ends.

A year is a leap year when it divides by four, except that a year dividing by
one hundred is not, unless it also divides by four hundred.`,
    language: 'java',
    difficulty: 'easy',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int from = scanner.nextInt();
        int to = scanner.nextInt();
        // your code here
    }
}
`,
    inputs: [
      { input: '2000 2020', sample: true },
      { input: '1900 1900', sample: true },
      { input: '2000 2000' },
      { input: '1999 2001' },
      { input: '1896 1904' },
      { input: '2023 2023' },
      { input: '1 400' },
    ],
    solutions: [
      // Ask each year in the span
      `import java.util.*;

public class Main {
    static boolean isLeap(int year) {
        if (year % 400 == 0) return true;
        if (year % 100 == 0) return false;
        return year % 4 == 0;
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int from = scanner.nextInt();
        int to = scanner.nextInt();
        int found = 0;
        for (int year = from; year <= to; year++) {
            if (isLeap(year)) found++;
        }
        System.out.print(found);
    }
}`,
      // A different route: count from the start of time and take the
      // difference, so nothing is walked
      `import java.util.*;

public class Main {
    static int upTo(int year) {
        if (year < 1) return 0;
        return year / 4 - year / 100 + year / 400;
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int from = scanner.nextInt();
        int to = scanner.nextInt();
        System.out.print(upTo(to) - upTo(from - 1));
    }
}`,
    ],
  },

  {
    slug: 'fizzbuzz-line',
    title: 'Fizz and Buzz',
    statement: `Write out the numbers with two of them replaced.

**Input** — one integer \`N\`, zero or more.
**Output** — the numbers \`1\` to \`N\` separated by single spaces, except that a
number dividing by three is written \`Fizz\`, one dividing by five is written
\`Buzz\`, and one dividing by both is written \`FizzBuzz\`.

\`N\` of zero produces no output.`,
    language: 'java',
    difficulty: 'easy',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int n = scanner.hasNextInt() ? scanner.nextInt() : 0;
        // your code here
    }
}
`,
    inputs: [
      { input: '5', sample: true },
      { input: '15', sample: true },
      { input: '0' },
      { input: '1' },
      { input: '3' },
      { input: '16' },
      { input: '20' },
    ],
    solutions: [
      // Ask which of the three cases each number falls into
      `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int n = scanner.hasNextInt() ? scanner.nextInt() : 0;
        StringBuilder out = new StringBuilder();
        for (int i = 1; i <= n; i++) {
            if (out.length() > 0) out.append(' ');
            if (i % 15 == 0) out.append("FizzBuzz");
            else if (i % 3 == 0) out.append("Fizz");
            else if (i % 5 == 0) out.append("Buzz");
            else out.append(i);
        }
        System.out.print(out);
    }
}`,
      // A different route: build the word up, and fall back to the number
      // only when nothing was added
      `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int limit = scanner.hasNextInt() ? scanner.nextInt() : 0;
        List<String> parts = new ArrayList<>();
        for (int i = 1; i <= limit; i++) {
            String word = "";
            if (i % 3 == 0) word += "Fizz";
            if (i % 5 == 0) word += "Buzz";
            parts.add(word.isEmpty() ? String.valueOf(i) : word);
        }
        System.out.print(String.join(" ", parts));
    }
}`,
    ],
  },

  {
    slug: 'remove-vowels',
    title: 'Take the Vowels Out',
    statement: `Drop every vowel from a line.

**Input** — one line of text (possibly empty).
**Output** — the same line with every \`a\`, \`e\`, \`i\`, \`o\` and \`u\` removed.

Upper case vowels go too. Everything else is left exactly as it is.`,
    language: 'javascript',
    difficulty: 'easy',
    starterCode: `const input = require('fs').readFileSync(0, 'utf8');

function solve(input) {
  // your code here
}

process.stdout.write(String(solve(input)));
`,
    inputs: [
      { input: 'hello world', sample: true },
      { input: 'AEIOU', sample: true },
      { input: '' },
      { input: 'xyz' },
      { input: 'Programming' },
      { input: 'rhythm' },
      { input: 'aAbBcC' },
    ],
    solutions: [
      // Keep the characters that are not vowels
      `const line = require('fs').readFileSync(0, 'utf8').replace(/\\n$/, '');
const vowels = 'aeiouAEIOU';
let out = '';
for (const ch of line) {
  if (!vowels.includes(ch)) out += ch;
}
process.stdout.write(out);`,
      // A different route: one pattern, replacing them all with nothing
      `const text = require('fs').readFileSync(0, 'utf8').replace(/\\n$/, '');
process.stdout.write(text.replace(/[aeiou]/gi, ''));`,
    ],
  },

  {
    slug: 'squares-difference',
    title: 'Squares and Sums',
    statement: `Compare the square of a sum with the sum of squares.

**Input** — one integer \`N\`, zero or more.
**Output** — the difference between the square of \`1 + 2 + ... + N\` and the
total of \`1² + 2² + ... + N²\`.

For \`N\` of 3 the sum is \`6\`, so its square is \`36\`, while the squares add up
to \`14\`. The answer is \`22\`.`,
    language: 'python',
    difficulty: 'easy',
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: '3', sample: true },
      { input: '10', sample: true },
      { input: '0' },
      { input: '1' },
      { input: '2' },
      { input: '5' },
      { input: '100' },
    ],
    solutions: [
      // Add both up, then compare
      `import sys
n = int(sys.stdin.read().strip())
total = 0
squares = 0
for i in range(1, n + 1):
    total += i
    squares += i * i
sys.stdout.write(str(total * total - squares))`,
      // A different route: the two closed forms, with no loop at all
      `import sys
n = int(sys.stdin.read().strip())
total = n * (n + 1) // 2
squares = n * (n + 1) * (2 * n + 1) // 6
sys.stdout.write(str(total * total - squares))`,
    ],
  },
];
