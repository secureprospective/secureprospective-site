# SP+ shell prompt. Interactive bash only.
#
# Guarded on every side deliberately: if starship is missing or the terminal is
# not interactive, the advisor must still get a working shell. A prompt is not
# worth a broken login.
case $- in
    *i*) ;;
    *) return ;;
esac
[ -x /usr/bin/starship ] || return
eval "$(/usr/bin/starship init bash)" 2>/dev/null || true
