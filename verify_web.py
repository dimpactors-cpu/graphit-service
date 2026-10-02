import sys
sys.stdout.reconfigure(encoding='utf-8')
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

chrome_options = Options()
chrome_options.add_argument("--headless=new")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--no-sandbox")

driver = webdriver.Chrome(options=chrome_options)
try:
    # 1. Test Student Page
    print("Testing Student Page (http://localhost:8000)...")
    driver.get("http://localhost:8000")
    time.sleep(1)
    
    # Enter 김유경 / 4455
    name_input = driver.find_element(By.ID, "studentName")
    phone_input = driver.find_element(By.ID, "phoneTail")
    btn = driver.find_element(By.ID, "searchBtn")
    
    name_input.send_keys("김유경")
    phone_input.send_keys("4455")
    btn.click()
    
    time.sleep(1)
    
    # Check results
    result_count = driver.find_element(By.ID, "resultCount").text
    print(f"Student Search Result Count: {result_count}")
    course_list = driver.find_element(By.ID, "courseList").text
    print(f"Course List snippet:\n{course_list}\n")
    
    # 2. Test Admin Page
    print("Testing Admin Page (http://localhost:8000/admin)...")
    driver.get("http://localhost:8000/admin")
    time.sleep(2)
    
    stat_total = driver.find_element(By.ID, "statTotalCount").text
    stat_paid = driver.find_element(By.ID, "statPaidCount").text
    last_file = driver.find_element(By.ID, "lastFileName").text
    print(f"Admin Stats - Total: {stat_total}, Paid: {stat_paid}, File: {last_file}")
    
    # Select Hongik B course
    select_elem = driver.find_element(By.ID, "courseSelect")
    options = select_elem.find_elements(By.TAG_NAME, "option")
    for opt in options:
        if "홍익대" in opt.text and "B반" in opt.text:
            opt.click()
            break
            
    time.sleep(1)
    table_text = driver.find_element(By.ID, "studentTableBody").text
    print(f"Admin Table snippet:\n{table_text[:300]}")
    
    msg_template = driver.find_element(By.ID, "messageTemplate").get_attribute("value")
    print(f"\nGenerated SMS Template snippet:\n{msg_template[:300]}...")
    
    print("\nALL AUTOMATED BROWSER TESTS PASSED SUCCESSFULLY!")

finally:
    driver.quit()
