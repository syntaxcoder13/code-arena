# Judge0 with runtimes from this decade.
#
# The published judge0/judge0:1.13.1 image is the newest there is, and it
# ships Node 12, Python 3.8, Java 13 and Go 1.13 - old enough that `?.` and
# `??` are syntax errors, which is not a fair thing to hand a player in a
# timed battle. Newer runtimes exist only on Judge0's hosted service; there is
# no newer self-hostable image.
#
# But a language in Judge0 is only a database row naming a binary. So the
# runtimes are installed here and registered in Judge0's own seed. Nothing
# already in the image is replaced, so every existing language keeps working
# and old problems keep running exactly as they did.
#
# Everything goes under /usr/local, because that is what isolate makes
# visible inside the sandbox - the same place Judge0's own runtimes live.
#
# The base image is Debian 10 with glibc 2.28, which is exactly the minimum
# Node 18 and later require. That is why these versions and not newer ones.
#
# The languages are appended to Judge0's seed rather than inserted into the
# database afterwards, because Judge0 re-seeds on boot and its seed deletes
# every row in `languages` first. Rows added by hand disappear the next time
# a container is recreated, and nothing says so - submissions just start
# failing with "language with id 201 doesn't exist".
FROM judge0/judge0:1.13.1

USER root

# Node 22 LTS
RUN curl -fsSL https://nodejs.org/dist/v22.11.0/node-v22.11.0-linux-x64.tar.xz -o /tmp/node.tar.xz \
    && tar -xJf /tmp/node.tar.xz -C /usr/local \
    && mv /usr/local/node-v22.11.0-linux-x64 /usr/local/node-22 \
    && rm /tmp/node.tar.xz \
    && /usr/local/node-22/bin/node --version

# Python 3.13, as a relocatable build - python.org publishes no linux tarball
RUN curl -fsSL -o /tmp/python.tar.gz \
    https://github.com/astral-sh/python-build-standalone/releases/download/20241016/cpython-3.13.0+20241016-x86_64-unknown-linux-gnu-install_only.tar.gz \
    && tar -xzf /tmp/python.tar.gz -C /usr/local \
    && mv /usr/local/python /usr/local/python-3.13 \
    && rm /tmp/python.tar.gz \
    && /usr/local/python-3.13/bin/python3 --version

# Java 21 LTS
RUN curl -fsSL -o /tmp/jdk.tar.gz \
    https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.5%2B11/OpenJDK21U-jdk_x64_linux_hotspot_21.0.5_11.tar.gz \
    && tar -xzf /tmp/jdk.tar.gz -C /usr/local \
    && mv /usr/local/jdk-21.0.5+11 /usr/local/openjdk21 \
    && rm /tmp/jdk.tar.gz \
    && /usr/local/openjdk21/bin/java --version

# Go 1.23
RUN curl -fsSL -o /tmp/go.tar.gz https://go.dev/dl/go1.23.3.linux-amd64.tar.gz \
    && tar -xzf /tmp/go.tar.gz -C /usr/local \
    && mv /usr/local/go /usr/local/go-1.23.3 \
    && rm /tmp/go.tar.gz \
    && /usr/local/go-1.23.3/bin/go version

# Into Judge0's own seed, so a re-seed restores these rather than wiping them
COPY languages-extra.rb /tmp/languages-extra.rb
RUN active=$(find / -path /proc -prune -o -type f -path "*/db/languages/active.rb" -print -quit) \
    && test -n "$active" \
    && cat /tmp/languages-extra.rb >> "$active" \
    && rm /tmp/languages-extra.rb \
    && echo "registered in $active"
