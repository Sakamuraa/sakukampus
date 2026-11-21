# Changelog Sistem Penemuan Beasiswa Otomatis

**SakuKampus — Pencarian, Penyaringan, dan Publikasi Beasiswa**

21 November 2026

## Ringkasan Perubahan

- **Pencarian:** Fallback berlapis DuckDuckGo → Jina Reader → Bing, kueri berjangkar tahun akademik berikutnya, serta penyaring host agregator dan ber-login.
- **Pengambilan halaman:** Mengambil halaman detail tiap beasiswa, bukan hanya halaman daftar; mendeteksi blokir WAF dan mengulang dengan agen peramban.
- **Ekstraksi AI:** LLM pada router OpenAI-compatible mengekstrak data dan mengutip bukti dari teks halaman. JSON terpotong ditangani lewat kuota token lebih besar, percobaan ulang, kerangka JSON eksplisit, dan `response_format` `json_object`.
- **Penyaringan:** Pencocokan nama kampus berbasis token-set dengan sinonim; syarat yang tak dapat diperiksa mesin menjadi catatan, bukan penolakan.
- **Publikasi:** Penjadwal internal tiap 12 jam; hasil valid langsung tampil di katalog, detail, jadwal, API, dan pemeriksa kelayakan tanpa build ulang.
- **Hasil:** Waktu proses turun dari sekitar 143 detik ke 65 detik; 114 uji otomatis lulus.

## Pemetaan Butir Perubahan ke Referensi

| Butir Changelog | Referensi |
| --- | --- |
| Pencarian: fallback lintas mesin | [4] metasearch, [2] focused crawling |
| Pengambilan halaman: hanya halaman detail | [1] boilerplate, [3] web crawling |
| Ekstraksi AI: LLM dan kutipan bukti | [5][6][7] ekstraksi web, [10] RAG, [11] halusinasi |
| Ekstraksi AI: JSON terpotong, `response_format` | [9] guided generation |
| Penyaringan: pencocokan nama kampus | [8] record linkage |
| Publikasi: kelayakan otomatis | [12] prediksi kelayakan beasiswa |

## Daftar Referensi

[1] C. Kohlschütter, P. Fankhauser, W. Nejdl, "Boilerplate detection using shallow text features," Proc. 3rd ACM Int. Conf. Web Search and Data Mining (WSDM), 2010, pp. 441–450. doi: 10.1145/1718487.1718542

[2] S. Chakrabarti, M. van den Berg, B. Dom, "Focused crawling: a new approach to topic-specific Web resource discovery," Computer Networks, vol. 31, no. 11–16, pp. 1623–1640, 1999. doi: 10.1016/S1389-1286(99)00052-3

[3] C. Olston, M. Najork, "Web Crawling," Foundations and Trends in Information Retrieval, vol. 4, no. 3, pp. 175–246, 2010. doi: 10.1561/1500000017

[4] W. Meng, C. Yu, K.-L. Liu, "Building efficient and effective metasearch engines," ACM Computing Surveys, vol. 34, no. 1, pp. 48–89, 2002. doi: 10.1145/505282.505284

[5] V. Crescenzi, G. Mecca, P. Merialdo, "RoadRunner: towards automatic data extraction from large web sites," Proc. 28th Int. Conf. Management of Data (SIGMOD), 2002, p. 624. doi: 10.1145/564691.564778

[6] N. Kushmerick, "Wrapper induction: Efficiency and expressiveness," Artificial Intelligence, vol. 118, no. 1–2, pp. 15–68, 2000. doi: 10.1016/S0004-3702(99)00100-9

[7] Y. Zhai, B. Liu, "Web data extraction based on partial tree alignment," Proc. 14th Int. Conf. World Wide Web (WWW), 2005, pp. 76–85. doi: 10.1145/1060745.1060761

[8] I. P. Fellegi, A. B. Sunter, "A Theory for Record Linkage," Journal of the American Statistical Association, vol. 64, no. 328, pp. 1183–1210, 1969. doi: 10.1080/01621459.1969.10501049

[9] B. T. Willard, R. Louf, "Efficient Guided Generation for Large Language Models," arXiv:2307.09702, 2023.

[10] P. Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks," arXiv:2005.11401, 2020 (NeurIPS 2020).

[11] Z. Ji et al., "Survey of Hallucination in Natural Language Generation," ACM Computing Surveys, vol. 55, no. 12, pp. 1–38, 2023. doi: 10.1145/3571730

[12] R. Remolado, J. Perocho, R. Hormillada, "Predicting Scholarship Eligibility Using Machine Learning: A Data-Driven Approach," Proc. 9th Int. Conf. Information Technology, Information Systems and Electrical Engineering (ICITISEE), 2025, pp. 421–426. doi: 10.1109/ICITISEE68184.2025.11355053

## Catatan

- **Cakupan referensi:** Referensi di atas mendukung metodenya, bukan membuktikan sistem ini berhasil. Hasil empiris tetap dilaporkan sebagai data pengujian sendiri.
- **Layanan pihak ketiga:** Jina Reader dan Bing tidak memiliki rujukan akademik karena merupakan pilihan rekayasa, sehingga disebut sebagai layanan pihak ketiga dan bukan sitasi.
- **Referensi yang tidak dimasukkan:** Cohen, "A Comparison of String Distance Metrics for Name-Matching Tasks" (IIWeb 2003) tidak dapat diverifikasi melalui Crossref maupun DBLP, sehingga tidak dicantumkan.
