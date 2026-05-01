#!/usr/bin/env python3
"""
Inverted Index Builder - Command Line Tool (Arabic and English support)
"""

import os
import argparse
from inverted_index_builder import main

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build an inverted index from a folder of scraped text files.")
    parser.add_argument("input_folder", help="Path to the folder containing the text files")
    parser.add_argument("-o", "--output", help="Path to the output file (optional)", default=None)

    args = parser.parse_args()

    if not os.path.isdir(args.input_folder):
        print(f"Error: The input folder '{args.input_folder}' does not exist.")
        exit(1)

    main(args.input_folder, args.output)