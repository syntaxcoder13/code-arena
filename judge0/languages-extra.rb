
# --- Added by OpenSourceHub -------------------------------------------------
#
# Appended to Judge0's own db/languages/active.rb inside the image, so these
# are part of the seed rather than something added afterwards.
#
# That matters: Judge0 re-seeds on boot and its seed deletes every row in
# `languages` first. Rows inserted by hand vanish the next time a container is
# recreated, silently - submissions simply start failing with "language with
# id 201 doesn't exist". Being in the seed is what makes them survive.
#
# Ids start at 200 because Judge0's own stop below 100. The older runtimes are
# left registered, so problems written against them keep running.

@languages +=
[
  {
    id: 201,
    name: "JavaScript (Node.js 22.11.0)",
    is_archived: false,
    source_file: "script.js",
    run_cmd: "/usr/local/node-22/bin/node script.js"
  },
  {
    id: 202,
    name: "Python (3.13.0)",
    is_archived: false,
    source_file: "script.py",
    run_cmd: "/usr/local/python-3.13/bin/python3 script.py"
  },
  {
    id: 203,
    name: "Java (OpenJDK 21.0.5)",
    is_archived: false,
    source_file: "Main.java",
    compile_cmd: "/usr/local/openjdk21/bin/javac %s Main.java",
    run_cmd: "/usr/local/openjdk21/bin/java Main"
  }
]
