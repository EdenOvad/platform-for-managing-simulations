import { useState } from 'react';
import { Card, Col, Container, DropdownItem, DropdownMenu, DropdownToggle, Row, UncontrolledDropdown } from 'reactstrap';
import DataTable, { TableColumn } from 'react-data-table-component';
import { ChevronDown, Edit, MoreVertical, Play, Trash2 } from 'react-feather';

// Define the type for a single simulation
interface Simulation {
    simulatorName: string;
    date: string;
    isRunning: boolean;
    parameters: string;
}

const Dashboard = () => {
    const paginationRowsPerPageOptions = [15, 30, 50, 100];
    const [simulations] = useState<Simulation[]>([
        {
            simulatorName: 'string',
            date: 'string',
            isRunning: true,
            parameters: 'string'
        }
    ]);

    const columns: TableColumn<Simulation>[] = [
        {
            name: 'Simulator Name',
            selector: (row) => row.simulatorName,
            sortable: true
        },
        {
            name: 'Date',
            selector: (row) => row.date,
            sortable: true
        },
        {
            name: 'Is Running?',
            selector: (row) => row.isRunning.toString(),
            sortable: true
        },
        {
            name: 'Parameters',
            selector: (row) => row.parameters,
            sortable: true
        },
        {
            name: 'Actions',
            width: '120px',
            cell: (row) => {
                return (
                    <>
                        <UncontrolledDropdown>
                            <DropdownToggle tag="div" className="btn btn-sm">
                                <MoreVertical size={14} className="cursor-pointer action-btn" />
                            </DropdownToggle>
                            <DropdownMenu end container="body">
                                <DropdownItem className="w-100">
                                    <Play size={14} className="mr-50" />
                                    <span className="align-middle mx-2">Re-Run</span>
                                </DropdownItem>
                                <DropdownItem className="w-100">
                                    <Edit size={14} className="mr-50" />
                                    <span className="align-middle mx-2">Edit</span>
                                </DropdownItem>
                                <DropdownItem className="w-100">
                                    <Trash2 size={14} className="mr-50" />
                                    <span className="align-middle mx-2">Delete</span>
                                </DropdownItem>
                            </DropdownMenu>
                        </UncontrolledDropdown>
                    </>
                );
            }
        }
    ];

    return (
        <div className="main-view">
            <Container>
                <Row className="my-3">
                    <Col>
                        <h4 className="main-title">Simulation Manager</h4>
                    </Col>
                </Row>
                <Card>
                    <DataTable
                        data={simulations}
                        responsive
                        className="react-dataTable"
                        pagination
                        paginationRowsPerPageOptions={paginationRowsPerPageOptions}
                        columns={columns}
                        sortIcon={<ChevronDown />}
                    />
                </Card>
            </Container>
        </div>
    );
};

export default Dashboard;
