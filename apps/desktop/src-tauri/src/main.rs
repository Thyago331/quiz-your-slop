// Sem console extra no Windows em release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    quiz_your_slop_lib::rodar();
}
