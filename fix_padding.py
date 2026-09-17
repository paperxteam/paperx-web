import re

with open('components/ProfilePanel.tsx', 'r') as f:
    code = f.read()

# Replace `pt-[60px] sm:pt-[64px] p-6 md:p-8` with `px-6 pb-6 md:px-8 md:pb-8 pt-[72px] sm:pt-[80px]`
def replace_padding(match):
    full_str = match.group(0)
    # Extract the padding classes
    # match.group(1) is something like "p-6 md:p-8"
    p_classes = match.group(1).split()
    new_classes = []
    for c in p_classes:
        if c.startswith('p-'):
            val = c[2:]
            new_classes.append(f'px-{val} pb-{val}')
        elif 'p-' in c: # like sm:p-6
            prefix, rest = c.split('p-')
            new_classes.append(f'{prefix}px-{rest} {prefix}pb-{rest}')
        else:
            new_classes.append(c)
    
    return f'className="flex-1 overflow-y-auto pt-[72px] sm:pt-[80px] {" ".join(new_classes)}"'

code = re.sub(
    r'className="flex-1 overflow-y-auto pt-\[60px\] sm:pt-\[64px\] (p-[^"]+)"',
    replace_padding,
    code
)

with open('components/ProfilePanel.tsx', 'w') as f:
    f.write(code)
