<?php

/*
Service Repair Shop API
Integration with Android using Retrofit and Gson
*/

// Disable direct error output and log errors instead
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'servisaldi'); // Change this to your DB name

// Database connection
function getConnection()
{
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        sendResponse(500, ['error' => 'Database connection failed: ' . $conn->connect_error]);
    }
    return $conn;
}

// Send JSON response
function sendResponse($code, $data)
{
    http_response_code($code);
    echo json_encode($data);
    exit();
}

// Get request method and endpoint
$method = $_SERVER['REQUEST_METHOD'];
$request = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

// Get JSON input for PUT, or POST data for other requests
$input = [];
if ($method === 'PUT' || $method === 'POST' && strpos($_SERVER["CONTENT_TYPE"], "application/json") !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
}

// Router
switch ($request) {
    case 'services':
        handleServices($method, $id, $input);
        break;
    case 'transactions':
        handleTransactions($method, $id, $input);
        break;
    default:
        sendResponse(404, ['error' => 'Endpoint not found']);
}

// ============ SERVICES HANDLERS ============
function handleServices($method, $id, $input)
{
    $conn = getConnection();

    switch ($method) {
        case 'GET':
            if ($id) {
                // Get single service
                $stmt = $conn->prepare("SELECT * FROM service WHERE id = ?");
                $stmt->bind_param("i", $id);
                $stmt->execute();
                $result = $stmt->get_result();

                if ($row = $result->fetch_assoc()) {
                    sendResponse(200, $row);
                } else {
                    sendResponse(404, ['error' => 'Service not found']);
                }
            } else {
                // Get all services
                $result = $conn->query("SELECT * FROM service ORDER BY id DESC");
                $services = [];
                while ($row = $result->fetch_assoc()) {
                    $services[] = $row;
                }
                sendResponse(200, $services);
            }
            break;

        case 'POST':
            // Create new service
            if (!isset($input['name']) || !isset($input['price'])) {
                sendResponse(400, ['error' => 'Name and price are required']);
            }
            
            $name = trim($input['name']);
            $price = intval($input['price']);
            $description = isset($input['description']) ? trim($input['description']) : '';
            
            if (empty($name)) {
                sendResponse(400, ['error' => 'Name cannot be empty']);
            }
            
            if ($price <= 0) {
                sendResponse(400, ['error' => 'Price must be greater than 0']);
            }
            
            // Check for duplicate service name
            $checkStmt = $conn->prepare("SELECT id FROM service WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))");
            $checkStmt->bind_param("s", $name);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();
            
            if ($checkResult->num_rows > 0) {
                sendResponse(409, ['error' => 'A service with this name already exists']);
            }

            $stmt = $conn->prepare("INSERT INTO service (name, price, description) VALUES (?, ?, ?)");
            $stmt->bind_param("sis", $name, $price, $description);

            if ($stmt->execute()) {
                sendResponse(201, [
                    'message' => 'Service created successfully',
                    'id' => $conn->insert_id
                ]);
            } else {
                sendResponse(500, ['error' => 'Failed to create service']);
            }
            break;

        case 'PUT':
            // Update service
            if (!$id) {
                sendResponse(400, ['error' => 'Service ID is required']);
            }

            $fields = [];
            $types = "";
            $values = [];

            if (isset($input['name'])) {
                $name = trim($input['name']);
                if (empty($name)) {
                    sendResponse(400, ['error' => 'Service name cannot be empty']);
                }
                
                // Check if name is being changed and if new name already exists
                $currentStmt = $conn->prepare("SELECT name FROM service WHERE id = ?");
                $currentStmt->bind_param("i", $id);
                $currentStmt->execute();
                $currentResult = $currentStmt->get_result();
                $currentRow = $currentResult->fetch_assoc();
                
                if ($currentRow && strtolower(trim($currentRow['name'])) !== strtolower($name)) {
                    $checkStmt = $conn->prepare("SELECT id FROM service WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND id != ?");
                    $checkStmt->bind_param("si", $name, $id);
                    $checkStmt->execute();
                    $checkResult = $checkStmt->get_result();
                    
                    if ($checkResult->num_rows > 0) {
                        sendResponse(409, ['error' => 'A service with this name already exists']);
                    }
                }
                
                $fields[] = "name = ?";
                $types .= "s";
                $values[] = $name;
            }
            
            if (isset($input['price'])) {
                if ($input['price'] <= 0) {
                    sendResponse(400, ['error' => 'Price must be greater than 0']);
                }
                $fields[] = "price = ?";
                $types .= "i";
                $values[] = intval($input['price']);
            }
            
            if (isset($input['description'])) {
                $fields[] = "description = ?";
                $types .= "s";
                $values[] = trim($input['description']);
            }

            if (empty($fields)) {
                sendResponse(400, ['error' => 'No fields to update']);
            }

            $values[] = $id;
            $types .= "i";

            $sql = "UPDATE service SET " . implode(", ", $fields) . " WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param($types, ...$values);

            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    sendResponse(200, ['message' => 'Service updated successfully']);
                } else {
                    sendResponse(404, ['error' => 'Service not found']);
                }
            } else {
                sendResponse(500, ['error' => 'Failed to update service']);
            }
            break;

        case 'DELETE':
            // Delete service
            if (!$id) {
                sendResponse(400, ['error' => 'Service ID is required']);
            }

            $stmt = $conn->prepare("DELETE FROM service WHERE id = ?");
            $stmt->bind_param("i", $id);

            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    sendResponse(200, ['message' => 'Service deleted successfully']);
                } else {
                    sendResponse(404, ['error' => 'Service not found']);
                }
            } else {
                sendResponse(500, ['error' => 'Failed to delete service']);
            }
            break;

        default:
            sendResponse(405, ['error' => 'Method not allowed']);
    }
}

// ============ TRANSACTIONS HANDLERS ============
function handleTransactions($method, $id, $input)
{
    $conn = getConnection();

    switch ($method) {
        case 'GET':
            if ($id) {
                // Get single transaction with service details (JOIN)
                $stmt = $conn->prepare("
                    SELECT 
                        st.id,
                        st.service_id,
                        s.name as service_name,
                        st.customer_name,
                        st.device_type,
                        st.device_brand,
                        st.problem,
                        st.image_path,
                        st.price,
                        st.date,
                        st.status
                    FROM service_transactions st
                    JOIN service s ON st.service_id = s.id
                    WHERE st.id = ?
                ");
                $stmt->bind_param("i", $id);
                $stmt->execute();
                $result = $stmt->get_result();

                if ($row = $result->fetch_assoc()) {
                    sendResponse(200, $row);
                } else {
                    sendResponse(404, ['error' => 'Transaction not found']);
                }
            } else {
                // Get all transactions with service details (JOIN)
                $result = $conn->query("
                    SELECT 
                        st.id,
                        st.service_id,
                        s.name as service_name,
                        st.customer_name,
                        st.device_type,
                        st.device_brand,
                        st.problem,
                        st.image_path,
                        st.price,
                        st.date,
                        st.status
                    FROM service_transactions st
                    JOIN service s ON st.service_id = s.id
                    ORDER BY st.date DESC
                ");

                if (!$result) {
                    sendResponse(500, ['error' => 'Database query failed: ' . $conn->error]);
                }

                $transactions = [];
                while ($row = $result->fetch_assoc()) {
                    $transactions[] = $row;
                }
                sendResponse(200, $transactions);
            }
            break;

        case 'POST':
            // Create new transaction
            // We use $_POST because the data is coming from multipart/form-data
            if (!isset($_POST['service_id']) || !isset($_POST['customer_name']) || 
                !isset($_POST['device_type']) || !isset($_POST['device_brand']) || 
                !isset($_POST['problem']) || !isset($_POST['price'])) {
                sendResponse(400, ['error' => 'All fields are required']);
            }
            
            $service_id = intval($_POST['service_id']);
            $customer_name = trim($_POST['customer_name']);
            $device_type = trim($_POST['device_type']);
            $device_brand = trim($_POST['device_brand']);
            $problem = trim($_POST['problem']);
            $price = intval($_POST['price']);
            $status = isset($_POST['status']) ? trim($_POST['status']) : 'Pending';
            $image_path = null;
            
            if ($service_id <= 0) {
                sendResponse(400, ['error' => 'Invalid service ID']);
            }
            
            if (empty($customer_name) || empty($device_type) || empty($device_brand) || empty($problem)) {
                sendResponse(400, ['error' => 'All fields must be filled']);
            }
            
            if ($price <= 0) {
                sendResponse(400, ['error' => 'Price must be greater than 0']);
            }
            
            // Verify service exists
            $verifyStmt = $conn->prepare("SELECT id FROM service WHERE id = ?");
            $verifyStmt->bind_param("i", $service_id);
            $verifyStmt->execute();
            $verifyResult = $verifyStmt->get_result();
            
            if ($verifyResult->num_rows === 0) {
                sendResponse(404, ['error' => 'Selected service does not exist']);
            }

            // Handle file upload
            if (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
                $uploadDir = 'uploads/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                $fileName = uniqid() . '-' . basename($_FILES['image']['name']);
                $targetPath = $uploadDir . $fileName;
                
                // Validate file type
                $imageFileType = strtolower(pathinfo($targetPath, PATHINFO_EXTENSION));
                $allowedTypes = ['jpg', 'jpeg', 'png', 'gif'];
                if (!in_array($imageFileType, $allowedTypes)) {
                    sendResponse(400, ['error' => 'Only JPG, JPEG, PNG & GIF files are allowed.']);
                }

                if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
                    $image_path = $targetPath;
                } else {
                    sendResponse(500, ['error' => 'Failed to upload image.']);
                }
            }

            $stmt = $conn->prepare("INSERT INTO service_transactions (service_id, customer_name, device_type, device_brand, problem, price, status, image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("isssisss", $service_id, $customer_name, $device_type, $device_brand, $problem, $price, $status, $image_path);

            if ($stmt->execute()) {
                sendResponse(201, [
                    'message' => 'Transaction created successfully',
                    'id' => $conn->insert_id
                ]);
            } else {
                sendResponse(500, ['error' => 'Failed to create transaction']);
            }
            break;

        case 'PUT':
            // Update transaction (mostly for status updates)
            if (!$id) {
                sendResponse(400, ['error' => 'Transaction ID is required']);
            }

            $fields = [];
            $types = "";
            $values = [];

            if (isset($input['service_id'])) {
                $fields[] = "service_id = ?";
                $types .= "i";
                $values[] = intval($input['service_id']);
            }
            if (isset($input['customer_name'])) {
                $fields[] = "customer_name = ?";
                $types .= "s";
                $values[] = trim($input['customer_name']);
            }
            if (isset($input['device_type'])) {
                $fields[] = "device_type = ?";
                $types .= "s";
                $values[] = trim($input['device_type']);
            }
            if (isset($input['device_brand'])) {
                $fields[] = "device_brand = ?";
                $types .= "s";
                $values[] = trim($input['device_brand']);
            }
            if (isset($input['problem'])) {
                $fields[] = "problem = ?";
                $types .= "s";
                $values[] = trim($input['problem']);
            }
            if (isset($input['price'])) {
                $fields[] = "price = ?";
                $types .= "i";
                $values[] = intval($input['price']);
            }
            if (isset($input['status'])) {
                $fields[] = "status = ?";
                $types .= "s";
                $values[] = trim($input['status']);
            }

            if (empty($fields)) {
                sendResponse(400, ['error' => 'No fields to update']);
            }

            $values[] = $id;
            $types .= "i";

            $sql = "UPDATE service_transactions SET " . implode(", ", $fields) . " WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param($types, ...$values);

            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    sendResponse(200, ['message' => 'Transaction updated successfully']);
                } else {
                    sendResponse(404, ['error' => 'Transaction not found or no changes made']);
                }
            } else {
                sendResponse(500, ['error' => 'Failed to update transaction']);
            }
            break;

        case 'DELETE':
            // Delete transaction
            if (!$id) {
                sendResponse(400, ['error' => 'Transaction ID is required']);
            }

            $stmt = $conn->prepare("DELETE FROM service_transactions WHERE id = ?");
            $stmt->bind_param("i", $id);

            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    sendResponse(200, ['message' => 'Transaction deleted successfully']);
                } else {
                    sendResponse(404, ['error' => 'Transaction not found']);
                }
            } else {
                sendResponse(500, ['error' => 'Failed to delete transaction']);
            }
            break;

        default:
            sendResponse(405, ['error' => 'Method not allowed']);
    }
}
?>