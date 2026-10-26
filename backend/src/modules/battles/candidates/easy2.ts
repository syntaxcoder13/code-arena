import { ProblemCandidate } from '../problem-candidate.types';

/**
 * Second batch, easy.
 *
 * JavaScript, Python and Java now run current versions, so these are written
 * the way anyone would write them today. Go is still 1.13, which has no
 * generics - see judge0/README.md for why.
 */
export const EASY_CANDIDATES_2: ProblemCandidate[] = [
  {
    slug: 'reverse-words',
    title: 'Reverse the Words',
    statement: `Put the words of a line in the opposite order.

**Input** — one line of words separated by single spaces (possibly empty).
**Output** — the same words, last one first, separated by single spaces.

The words themselves are not reversed, only their order.`,
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
      { input: 'the quick brown fox', sample: true },
      { input: '' },
      { input: 'one' },
      { input: 'a b c' },
      { input: 'alpha beta gamma delta' },
    ],
    solutions: [
      // Split, reverse, join
      `const line = require('fs').readFileSync(0, 'utf8').replace(/\\n$/, '');
process.stdout.write(line.split(' ').reverse().join(' '));`,
      // A different route: walk from the end, collecting each word
      `const line = require('fs').readFileSync(0, 'utf8').replace(/\\n$/, '');
const words = line.split(' ');
let out = '';
for (let i = words.length - 1; i >= 0; i--) {
  out += words[i];
  if (i > 0) out += ' ';
}
process.stdout.write(out);`,
    ],
  },

  {
    slug: 'caesar-shift',
    title: 'Caesar Shift',
    statement: `Shift every letter forward through the alphabet.

**Input** — the first line is \`K\` (0 to 25), the second line is the text
(possibly empty).
**Output** — the text with each letter moved \`K\` places forward, wrapping from
\`z\` back to \`a\`.

Case is kept. Anything that is not a letter is left exactly as it is.`,
    language: 'python',
    difficulty: 'easy',
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: '3\nabc xyz', sample: true },
      { input: '1\nHello, World!', sample: true },
      { input: '0\nunchanged' },
      { input: '25\na' },
      { input: '13\nThe Quick Brown Fox' },
      { input: '5\n' },
      { input: '2\nzebra 42' },
    ],
    solutions: [
      // Arithmetic on character codes
      `import sys
lines = sys.stdin.read().split("\\n")
k = int(lines[0]) if lines and lines[0].strip() else 0
text = lines[1] if len(lines) > 1 else ""
out = []
for ch in text:
    if "a" <= ch <= "z":
        out.append(chr((ord(ch) - 97 + k) % 26 + 97))
    elif "A" <= ch <= "Z":
        out.append(chr((ord(ch) - 65 + k) % 26 + 65))
    else:
        out.append(ch)
sys.stdout.write("".join(out))`,
      // A different route: build a translation table once
      `import sys, string
parts = sys.stdin.read().split("\\n")
shift = int(parts[0]) if parts and parts[0].strip() else 0
body = parts[1] if len(parts) > 1 else ""
lower = string.ascii_lowercase
upper = string.ascii_uppercase
table = str.maketrans(
    lower + upper,
    lower[shift:] + lower[:shift] + upper[shift:] + upper[:shift],
)
sys.stdout.write(body.translate(table))`,
    ],
  },

  {
    slug: 'binary-to-decimal',
    title: 'Binary to Decimal',
    statement: `Read a binary number and write it in decimal.

**Input** — one line of \`0\` and \`1\` characters, possibly with leading zeros.
**Output** — the same number in decimal.`,
    language: 'python',
    difficulty: 'easy',
    starterCode: `import sys

data = sys.stdin.read()

# your code here
`,
    inputs: [
      { input: '1010', sample: true },
      { input: '0', sample: true },
      { input: '1' },
      { input: '11111111' },
      { input: '0001' },
      { input: '100000' },
      { input: '10101010' },
    ],
    solutions: [
      // The library knows base 2
      `import sys
sys.stdout.write(str(int(sys.stdin.read().strip(), 2)))`,
      // A different route: double and add, left to right
      `import sys
total = 0
for ch in sys.stdin.read().strip():
    total = total * 2 + (1 if ch == "1" else 0)
sys.stdout.write(str(total))`,
    ],
  },

  {
    slug: 'clean-palindrome',
    title: 'Palindrome, Loosely',
    statement: `Decide whether a line reads the same backwards.

**Input** — one line of text (possibly empty).
**Output** — \`true\` or \`false\`.

Only letters and digits count. Everything else is ignored, and upper and lower
case are treated as the same. An empty line reads the same backwards.`,
    language: 'java',
    difficulty: 'easy',
    starterCode: `import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String line = reader.readLine();
        if (line == null) line = "";
        // your code here
    }
}
`,
    inputs: [
      { input: 'A man, a plan, a canal: Panama', sample: true },
      { input: 'race a car', sample: true },
      { input: '' },
      { input: 'ab' },
      { input: '12321' },
      { input: 'hello' },
      { input: "No 'x' in Nixon" },
    ],
    solutions: [
      // Strip to the characters that matter, then compare with the reverse
      `import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String line = reader.readLine();
        if (line == null) line = "";
        StringBuilder kept = new StringBuilder();
        for (char c : line.toCharArray()) {
            if (Character.isLetterOrDigit(c)) kept.append(Character.toLowerCase(c));
        }
        String forwards = kept.toString();
        String backwards = kept.reverse().toString();
        System.out.print(forwards.equals(backwards) ? "true" : "false");
    }
}`,
      // A different route: two pointers walking inwards, skipping as they go
      `import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String line = reader.readLine();
        if (line == null) line = "";
        int left = 0;
        int right = line.length() - 1;
        boolean same = true;
        while (left < right) {
            while (left < right && !Character.isLetterOrDigit(line.charAt(left))) left++;
            while (left < right && !Character.isLetterOrDigit(line.charAt(right))) right--;
            if (left < right) {
                if (Character.toLowerCase(line.charAt(left)) != Character.toLowerCase(line.charAt(right))) {
                    same = false;
                    break;
                }
                left++;
                right--;
            }
        }
        System.out.print(same ? "true" : "false");
    }
}`,
    ],
  },

  {
    slug: 'running-total',
    title: 'Running Total',
    statement: `Report the total so far after each number.

**Input** — one line of integers separated by single spaces (possibly empty).
**Output** — the running totals, separated by single spaces.

\`1 2 3\` gives \`1 3 6\`.`,
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
      { input: '1 2 3', sample: true },
      { input: '-1 1 -1 1', sample: true },
      { input: '' },
      { input: '5' },
      { input: '0 0 0' },
      { input: '10 20 30 40' },
      { input: '-5 -5' },
    ],
    solutions: [
      // One pass, carrying the total
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
	out := []string{}
	total := 0
	for {
		var n int
		if _, err := fmt.Fscan(reader, &n); err != nil {
			break
		}
		total += n
		out = append(out, strconv.Itoa(total))
	}
	fmt.Print(strings.Join(out, " "))
}`,
      // A different route: read them all, then add up each prefix from scratch
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
	nums := []int{}
	for {
		var n int
		if _, err := fmt.Fscan(reader, &n); err != nil {
			break
		}
		nums = append(nums, n)
	}
	out := []string{}
	for i := range nums {
		sum := 0
		for j := 0; j <= i; j++ {
			sum += nums[j]
		}
		out = append(out, strconv.Itoa(sum))
	}
	fmt.Print(strings.Join(out, " "))
}`,
    ],
  },
];
