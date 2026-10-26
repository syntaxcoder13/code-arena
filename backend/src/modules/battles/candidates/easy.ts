import { ProblemCandidate } from '../problem-candidate.types';

/**
 * Easy problems: one idea each, solvable in a few minutes, but with an edge
 * case that separates a careful answer from a hasty one.
 *
 * Runtime versions on this Judge0 are old, so nothing newer than Node 12,
 * Python 3.8, Java 13 or Go 1.13 is used anywhere.
 */
export const EASY_CANDIDATES: ProblemCandidate[] = [
  {
    slug: 'sum-a-line',
    title: 'Sum a Line',
    statement: `Add up the integers on one line.

**Input** — one line of integers separated by single spaces (possibly negative).
**Output** — their sum, on one line, with nothing else.`,
    language: 'javascript',
    difficulty: 'easy',
    starterCode: `const input = require('fs').readFileSync(0, 'utf8');

function solve(input) {
  // your code here
}

process.stdout.write(String(solve(input)));
`,
    inputs: [
      { input: '1 2 3', sample: true },
      { input: '10', sample: true },
      { input: '-5 5' },
      { input: '0 0 0' },
      { input: '7 8 9 10' },
      { input: '-1 -2 -3' },
    ],
    solutions: [
      // Straight through with reduce
      `const line = require('fs').readFileSync(0, 'utf8').trim();
const total = line.split(' ').reduce(function (sum, part) { return sum + Number(part); }, 0);
process.stdout.write(String(total));`,
      // A different route: a manual loop with parseInt
      `const line = require('fs').readFileSync(0, 'utf8').trim();
const parts = line.split(/\s+/);
let total = 0;
for (let i = 0; i < parts.length; i++) { total += parseInt(parts[i], 10); }
process.stdout.write(total.toString());`,
    ],
  },
  {
    slug: 'vowel-count',
    title: 'Count the Vowels',
    statement: `Count the vowels in a line.

**Input** — one line of text (possibly empty).
**Output** — a single integer: how many characters are \`a\`, \`e\`, \`i\`, \`o\` or \`u\`.

Upper case counts too. \`y\` is not a vowel.`,
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
      { input: 'xyz', sample: true },
      { input: '' },
      { input: 'AEIOU' },
      { input: 'Programming Is Fun' },
      { input: 'rhythm myths' },
      { input: 'aAaAa' },
    ],
    solutions: [
      // A set lookup, character by character
      `const text = require('fs').readFileSync(0, 'utf8').replace(/\\n$/, '');
const vowels = { a: 1, e: 1, i: 1, o: 1, u: 1 };
let count = 0;
for (let i = 0; i < text.length; i++) {
  if (vowels[text[i].toLowerCase()]) count++;
}
process.stdout.write(String(count));`,
      // A different route: a regular expression over the whole string
      `const text = require('fs').readFileSync(0, 'utf8').replace(/\\n$/, '');
const found = text.match(/[aeiou]/gi);
process.stdout.write(String(found === null ? 0 : found.length));`,
    ],
  },

  {
    slug: 'second-largest',
    title: 'Second Largest',
    statement: `Find the second largest **distinct** number.

**Input** — one line of integers separated by single spaces.
**Output** — the second largest distinct value, or \`none\` if there is no second one.

\`5 5 3\` has two distinct values, so the answer is \`3\`. \`5 5 5\` has one, so the
answer is \`none\`.`,
    language: 'python',
    difficulty: 'easy',
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: '3 1 4 1 5', sample: true },
      { input: '5 5 5', sample: true },
      { input: '5 5 3' },
      { input: '-1 -2 -3' },
      { input: '7' },
      { input: '2 2 1 1' },
      { input: '10 20 20 10 30' },
    ],
    solutions: [
      // Sort the distinct values and take the one below the top
      `import sys
values = sorted(set(int(part) for part in sys.stdin.read().split()))
sys.stdout.write(str(values[-2]) if len(values) >= 2 else "none")`,
      // A different route: one pass, carrying the best two seen so far
      `import sys
best = None
runner_up = None
for part in sys.stdin.read().split():
    n = int(part)
    if best is None or n > best:
        if best is not None and best != n:
            runner_up = best
        best = n
    elif n != best and (runner_up is None or n > runner_up):
        runner_up = n
sys.stdout.write("none" if runner_up is None else str(runner_up))`,
    ],
  },

  {
    slug: 'title-case-words',
    title: 'Title Case',
    statement: `Capitalise the first letter of every word.

**Input** — one line of words separated by single spaces (possibly empty).
**Output** — the same line, each word starting with an upper case letter and
the rest lower case.

A word may start with a digit or a symbol, in which case it is left as it is.`,
    language: 'python',
    difficulty: 'easy',
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: 'hello world', sample: true },
      { input: 'the QUICK brown fOX', sample: true },
      { input: '' },
      { input: 'a' },
      { input: '3d printing' },
      { input: 'ALL CAPS HERE' },
      { input: 'one' },
    ],
    solutions: [
      // Word by word, rebuilt from its first character
      `import sys
line = sys.stdin.read().rstrip("\\n")
words = line.split(" ")
out = []
for word in words:
    if word == "":
        out.append(word)
    else:
        out.append(word[0].upper() + word[1:].lower())
sys.stdout.write(" ".join(out))`,
      // A different route: a regular expression replacing each word
      `import re
import sys
line = sys.stdin.read().rstrip("\\n")
result = re.sub(r"\\S+", lambda m: m.group(0)[0].upper() + m.group(0)[1:].lower(), line)
sys.stdout.write(result)`,
    ],
  },

  {
    slug: 'digit-sum',
    title: 'Digit Sum',
    statement: `Add up the digits of a number.

**Input** — one integer, possibly negative, on one line.
**Output** — the sum of its digits. A minus sign is not a digit.

\`-123\` gives \`6\`.`,
    language: 'java',
    difficulty: 'easy',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // your code here
    }
}
`,
    inputs: [
      { input: '123', sample: true },
      { input: '-123', sample: true },
      { input: '0' },
      { input: '9999' },
      { input: '1000000' },
      { input: '-7' },
      { input: '505' },
    ],
    solutions: [
      // Over the characters of the text
      `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String line = scanner.next();
        int total = 0;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c >= '0' && c <= '9') total += c - '0';
        }
        System.out.print(total);
    }
}`,
      // A different route: arithmetic on the number itself
      `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        long n = Math.abs(scanner.nextLong());
        int total = 0;
        if (n == 0) { System.out.print(0); return; }
        while (n > 0) { total += (int) (n % 10); n /= 10; }
        System.out.print(total);
    }
}`,
    ],
  },

  {
    slug: 'range-gaps',
    title: 'Missing Numbers',
    statement: `List the numbers missing from a run.

**Input** — one line of distinct integers separated by single spaces, in no
particular order.
**Output** — every integer between the smallest and the largest that is not in
the input, in increasing order, separated by single spaces. Print nothing if
none are missing.`,
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
	_ = reader
	fmt.Print("")
}
`,
    inputs: [
      { input: '1 2 4 6', sample: true },
      { input: '3 1 2', sample: true },
      { input: '5' },
      { input: '-2 2' },
      { input: '10 7' },
      { input: '1 5 3' },
      { input: '0 3' },
    ],
    solutions: [
      // A set of what is present, walked from low to high
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
	seen := map[int]bool{}
	low, high, first := 0, 0, true
	for {
		var n int
		if _, err := fmt.Fscan(reader, &n); err != nil {
			break
		}
		seen[n] = true
		if first || n < low {
			low = n
		}
		if first || n > high {
			high = n
		}
		first = false
	}
	out := []string{}
	for i := low; i <= high; i++ {
		if !seen[i] {
			out = append(out, strconv.Itoa(i))
		}
	}
	fmt.Print(strings.Join(out, " "))
}`,
      // A different route: sort the values and report each gap between neighbours
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
	for i := 1; i < len(nums); i++ {
		for gap := nums[i-1] + 1; gap < nums[i]; gap++ {
			out = append(out, strconv.Itoa(gap))
		}
	}
	fmt.Print(strings.Join(out, " "))
}`,
    ],
  },
];
