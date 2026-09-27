# Verified sources (checked 27 Sep 2026)

Working notes for site content. Each URL returned HTTP 200 on the check date.
Where the original is dead, the web.archive.org snapshot is given instead.

## Implementations
- Razor — https://github.com/jimmoores/razor — modernised KRoC fork: real 64-bit support, K&R C modernised, Python 3 tooling, more tests. Platforms: x64 and aarch64 on macOS and Linux, with TVM as a fallback. Build: `./build --prefix=/usr/local/razor`. Components: occ21, tranx86, CCSP, TVM. Licence GPL-2+ (tools) / LGPL-2+ (libraries).
- KRoC upstream — https://github.com/concurrency/kroc ; classic page https://www.cs.kent.ac.uk/projects/ofa/kroc/ (KRoC 1.4.0, 14 Jan 2006); earliest release found is 0.9 beta, 1997 (https://www.wotug.org/parallel/occam/projects/occam-for-all/kroc/index.html)
- occ21 standalone — https://github.com/concurrency/occam-compiler ; nocc — https://github.com/concurrency/nocc ; Plumbing — https://github.com/concurrency/plumbing
- occam-pi.org — http://occam-pi.org/ (HTTP only) ; OccamDoc http://occam-pi.org/occamdoc/ ; concurrency.cc http://concurrency.cc/
- Transterpreter — http://web.archive.org/web/20220817124433/https://www.transterpreter.org/
- Tock — https://offog.org/code/tock/
- SPoC — https://www.wotug.org/parallel/occam/compilers/spoc/index.html (v1.1 1994, v1.3a 1998) ; original page http://web.archive.org/web/20060505015223/http://www.hpcc.ecs.soton.ac.uk/software/spoc/
- Inmos compiler sources — https://www.wotug.org/occam/compilers/inmos/
- Emulators — https://github.com/pahihu/t4 , https://github.com/devzendo/transputer-emulator , https://nanochess.org/transputer_emulator.html (JS, in-browser) , https://sites.google.com/site/transputeremulator/

## Specifications
- occam 2.1 Reference Manual (1995) — https://www.wotug.org/occam/documentation/oc21refman.pdf
- occam 3 draft (Barrett, 31 Mar 1992) — https://www.wotug.org/occam/documentation/oc3refman.pdf
- occam 2.1 changes — https://www.wotug.org/occam/documentation/oc21small.pdf
- occam 2 Reference Manual (1988) — https://www.transputer.net/obooks/isbn-013629312-3/oc20refman.pdf
- transputer.net occam books — https://www.transputer.net/obooks/obooks.asp ; tech notes https://www.transputer.net/tn/tn.asp
- TN8 Implementation of occam on the T414 — https://www.transputer.net/obooks/itn8/itn8.pdf
- occam-pi reference — http://web.archive.org/web/20201128224724/https://www.cs.kent.ac.uk/research/groups/plas/wiki/OccamPiReference/
- Barnes occam-pi tutorial — http://web.archive.org/web/20161022023151/http://frmb.org/occtutor.html

## WoTUG
- paper DB https://www.wotug.org/paperdb/ ; conferences https://www.wotug.org/paperdb/list_proceeds.php?f=1 ; papers https://www.wotug.org/paperdb/list_papers.php
- open dirs https://www.wotug.org/papers/ , https://www.wotug.org/occam/ , https://www.wotug.org/parallel/ (IPCA, Dave Beckett 1993–2000)
- folding editors page https://www.wotug.org/occam/folding.shtml
- IOS Press series — https://ebooks.iospress.nl/bookseries/concurrent-systems-engineering-series
- mirrors: https://www.transputer.net/ , http://bitsavers.trailing-edge.com/components/inmos/ , http://transputer.classiccmp.org/ , https://www.computinghistory.org.uk/sec/7128/Inmos/ , https://www.geekdot.com/transputer/

## CSP
- Hoare CSP book — http://web.archive.org/web/20231231101005/http://www.usingcsp.com/cspbook.pdf
- Hoare 1978 — https://dl.acm.org/doi/10.1145/359576.359585 ; PDF https://www.cs.cmu.edu/~crary/819-f09/Hoare78.pdf
- Roscoe TPC — https://www.cs.ox.ac.uk/bill.roscoe/publications/68b.pdf ; UCS https://www.cs.ox.ac.uk/ucs/
- FDR4 https://cocotec.io/fdr/ ; Oxford https://www.cs.ox.ac.uk/projects/fdr/ , https://www.cs.ox.ac.uk/projects/concurrency-tools/
- ProB https://prob.hhu.de/ ; PAT https://pat.comp.nus.edu.sg/
- Teig taxonomy https://www.teigfam.net/oyvind/home/technology/135-towards-a-taxonomy-of-csp-based-systems/

## Hardware
- https://www.transputer.net/ibooks/ibooks.asp ; http://bitsavers.trailing-edge.com/components/inmos/transputer/
- T42 FPGA transputer (CPA 2016) https://www.wotug.org/cpa2016/slides/31-slides.pdf ; https://ebooks.iospress.nl/volumearticle/51263
- TPCORE2 http://transputer.classiccmp.org/documentation/misc/TPCORE2.pdf
- Page & Luk 1991 https://www.doc.ic.ac.uk/~wl/papers/fpl91a.pdf
- Handel-C https://en.wikipedia.org/wiki/Handel-C ; XMOS https://github.com/xmos , https://en.wikipedia.org/wiki/XMOS
- oc-ray https://github.com/machineroom/oc-ray ; flag https://github.com/stepleton/flag

## Education
- Welch SEI/CMU course https://www.cs.kent.ac.uk/projects/ofa/sei-cmu/
- CO538 Q&A http://www.cs.kent.ac.uk/projects/ofa/co538/anonqa/index.html
- http://occam-pi.org/picourse/ , http://occam-pi.org/LearningResources/
- Jones & Goldsmith https://www.cs.ox.ac.uk/people/geraint.jones/publications/book/Pio2/
- Pountain & May http://www.transputer.net/obooks/72-occ-046-00/tuinocc.pdf
- Hyde https://www.eg.bucknell.edu/~cs366/occam.pdf
- books online http://web.archive.org/web/20070827023808/www.transterpreter.org/docs/booksonline.html
- bibliography 1990 http://www.transputer.net/obooks/oug/oug-bib.pdf
- Go FAQ https://go.dev/doc/faq ; Russ Cox https://swtch.com/~rsc/thread/

## Dates
occam 1983 (Proto-occam Jul 1983) · occam 2 1987 (manual 1988) · occam 2.1 1994 (manual May 1995) · occam 3 draft Mar 1992 · T414 Oct 1985 · T800 1987 · KRoC 0.9β 1997, 1.4.0 2006 · XMOS July 2005.

## Dead or blocked
usingcsp.com, transterpreter.org, frmb.org (use snapshots); Kent wiki (403 to bots); hpcc.ecs.soton.ac.uk (403).
