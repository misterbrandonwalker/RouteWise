import os
import cProfile, pstats
import logging
from logging.handlers import RotatingFileHandler

def read_variable(variable_name):
    if variable_name not in os.environ.keys():
        try:
            env_path = os.path.abspath(os.path.join(os.path.dirname( __file__ ), '..', '.env'))
            temp = open(env_path,'r')
            results = temp.readlines()
            temp.close()
            for line in results:
                line_split = line.split('=')
                key = line_split[0].replace('\n','')
                value = line_split[1].replace('\n','')
                if key == variable_name:
                    return value
            return None
        except:
            raise KeyError('Environment variable %s not found' % (variable_name))
    else:
        return os.environ[variable_name]


def enable_profiler():
    profiler = cProfile.Profile()
    profiler.enable()
    return profiler

def profile_results(profiler, results_name):
    cur_dir = os.getcwd()
    os.chdir('/common')
    folder_name = 'PerformanceProfiling'
    if not os.path.isdir(folder_name):
        os.mkdir(folder_name)
        change_file_permissions(folder_name)
    os.chdir(folder_name)
    profiler.disable()
    stream = open(results_name, 'w')
    stats = pstats.Stats(profiler, stream=stream)
    stats.sort_stats('cumtime')
    stats.print_stats()
    stream.flush()
    stream.close()
    change_file_permissions(results_name)
    change_file_permissions('/common')
    os.chdir(cur_dir)

def parse_results(results_name, function_name):
    cum_time = 0
    cur_dir = os.getcwd()
    os.chdir('/common')
    folder_name = 'PerformanceProfiling'
    os.chdir(folder_name)
    temp = open(results_name, 'r')
    results = temp.readlines()
    temp.close()
    for line in results:
        if function_name in line:
            line_split = line.split()
            cum_time = line_split[3]
    os.chdir(cur_dir)
    return cum_time

def profile_and_log(profiler, profile_name, function_name):
    profile_results(profiler, profile_name)
    cum_time = parse_results(profile_name, function_name)
    if cum_time == 0:
        msg = ""
    else:
        msg = 'Function: %s' % (function_name)+' '+'Cumulative Time: %s (s)' % (cum_time)
    return msg
    
def change_file_permissions(file_name):
    s = '777'
    try:
        if os.path.exists(file_name):
            os.chmod(file_name, int(s, base=8))
    except:
        pass


def write_to_log(msg, common_path = os.path.dirname(os.path.abspath(__file__)), log_name = 'ASPIRE', max_mb = 5, log_dir = 'Logs', print_out = True):
    if read_variable('disable_logging') == 'True':
        return
    
    cur_dir = os.getcwd()
    os.chdir(common_path)
    if not os.path.isdir(log_dir):
        os.mkdir(log_dir)
        change_file_permissions(log_dir)
    app_log = logging.getLogger(log_name)
    logFile = os.path.join(common_path, log_dir, log_name + '.log')
    if app_log.handlers == [] or not os.path.exists(logFile):
        app_log.handlers = [] # in case broken file handle if file was deleted
        log_formatter = logging.Formatter('%(asctime)s : %(levelname)s : %(name)s : %(message)s')
        my_handler = RotatingFileHandler(logFile, mode='a', maxBytes=max_mb*1024*1024, 
                                        backupCount=2, encoding=None, delay=0)
        my_handler.setFormatter(log_formatter)
        my_handler.setLevel(logging.INFO)
        app_log.setLevel(logging.INFO)
        app_log.addHandler(my_handler)
    app_log.info(msg)
    change_file_permissions(logFile)
    change_file_permissions('/common')
    if print_out:
        print(msg)
    os.chdir(cur_dir)

def replace_file_paths(tb):
    import re
    # Define a regular expression pattern to match file paths
    file_path_pattern = re.compile(r'File "([^"]+)", line \d+, in ')

    modified_traceback = file_path_pattern.sub(r'File "FILE_PATH", line 1, in ', tb)

    return modified_traceback
