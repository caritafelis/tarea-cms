#!/usr/bin/env python3
"""Quita las operaciones Query/Mutation viejas de graphql/models/*.graphql, conserva las de plataforma
en platform.graphql (protegidas con platform-admin) y elimina los inputs inseguros.
Uso (raiz del proyecto):  pip install graphql-core && python3 scripts/graphql-migrate.py"""
import glob, os, re, sys
from graphql import parse

ROOT = sys.argv[1] if len(sys.argv) > 1 else 'graphql'
MODELS = os.path.join(ROOT, 'models')
SKIP = {'api.graphql', 'platform.graphql'}
KEEP_Q = {'aiInsights', 'apiKeys', 'backup', 'backups', 'geolocation', 'inventoryHistories', 'invoices', 'orderRefund',
          'orderRefunds', 'permissions', 'plugins', 'role', 'roles', 'subscriptions', 'taxProviders', 'taxRateRules',
          'teamInvitations', 'webhook', 'webhooks'}
KEEP_Q_GUARD_ONLY = {'plan', 'plans', 'fieldGroup', 'fieldGroups'}
KEEP_M = {'createOrderRefund', 'createWebhook', 'updateWebhook', 'deleteWebhook'}
DROP_INPUTS = {'CreateProductTagInput', 'UpdateProductTagInput', 'CreateCategoryInput', 'UpdateCategoryInput',
               'CreateBrandInput', 'UpdateBrandInput', 'CreateSupplierInput', 'UpdateSupplierInput',
               'CreateDiscountInput', 'UpdateDiscountInput', 'CreateCartInput', 'CreateCartLineInput',
               'CreateAddressInput', 'UpdateAddressInput'}

def add_directive(text, directive):
    depth, i, colon = 0, 0, False
    while i < len(text):
        c = text[i]
        if c == '(':
            depth += 1
        elif c == ')':
            depth -= 1
        elif c == ':' and depth == 0:
            colon = True
        elif c == '@' and depth == 0 and colon:
            return text[:i] + directive + ' ' + text[i:]
        i += 1
    return text + ' ' + directive

def platform(t):
    if '@guard' in t:
        return t.replace('@guard', '@guard @can(ability: "platform-admin")', 1)
    return add_directive(t, '@guard @can(ability: "platform-admin")')

kept = {'Query': [], 'Mutation': []}
for path in sorted(glob.glob(os.path.join(MODELS, '*.graphql'))):
    if os.path.basename(path) in SKIP:
        continue
    src = open(path).read()
    doc = parse(src)
    cuts = []
    for d in doc.definitions:
        n = d.name.value
        if d.kind in ('object_type_definition', 'object_type_extension') and n in kept:
            for f in d.fields or []:
                t = src[f.loc.start:f.loc.end]
                name = f.name.value
                if n == 'Query' and name in KEEP_Q:
                    kept[n].append(platform(t))
                elif n == 'Query' and name in KEEP_Q_GUARD_ONLY:
                    t = t if '@guard' in t else add_directive(t, '@guard')
                    if name.startswith('fieldGroup'):
                        t = t.replace('@all', '@all(scopes: ["apiVisible"])').replace('@find', '@find(scopes: ["apiVisible"])')
                    kept[n].append(t)
                elif n == 'Mutation' and name in KEEP_M:
                    kept[n].append(platform(t))
            cuts.append((d.loc.start, d.loc.end))
        elif d.kind == 'input_object_type_definition' and n in DROP_INPUTS:
            cuts.append((d.loc.start, d.loc.end))
    for a, b in sorted(cuts, reverse=True):
        src = src[:a] + src[b:]
    src = re.sub(r'(type Webhook \{[^}]*?)\n\s*secret: String[^\n]*', r'\1', src, flags=re.S)  # secret nunca se expone
    src = re.sub(r'\n{3,}', '\n\n', src).strip() + '\n'
    open(path, 'w').write(src)

out = ['# Operaciones de plataforma (SaaS). Solo SuperAdmin (Gate "platform-admin").']
for k in ('Query', 'Mutation'):
    out.append('extend type %s {' % k)
    out += ['    ' + ' '.join(t.split()) for t in kept[k]]
    out.append('}')
open(os.path.join(MODELS, 'platform.graphql'), 'w').write('\n'.join(out) + '\n')
print('ok: %d queries, %d mutations de plataforma' % (len(kept['Query']), len(kept['Mutation'])))