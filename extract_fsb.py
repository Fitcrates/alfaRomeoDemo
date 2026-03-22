import fsb5
import sys
import os

def extract_fsb(fsb_file):
    print(f"Extracting: {fsb_file}")
    with open(fsb_file, 'rb') as f:
        data = f.read()

    fsb = fsb5.FSB5(data)
    out_dir = fsb_file + '_unpacked'
    if not os.path.exists(out_dir):
        os.makedirs(out_dir)

    print(f"Contains {len(fsb.samples)} samples. Header: {fsb.header}")
    for i, sample in enumerate(fsb.samples):
        print(f"Sample {i}: {sample.name}. Ext: {fsb.get_sample_extension()}")
        with open(os.path.join(out_dir, f"{sample.name}.{fsb.get_sample_extension()}"), 'wb') as fout:
            fout.write(fsb.rebuild_sample(sample))

extract_fsb('F:\\StronyInternetowe\\AlfaRomeo\\alfa-romeo-experience\\src\\assets\\sfx\\extracted_0.fsb')
extract_fsb('F:\\StronyInternetowe\\AlfaRomeo\\alfa-romeo-experience\\src\\assets\\sfx\\extracted_1.fsb')
