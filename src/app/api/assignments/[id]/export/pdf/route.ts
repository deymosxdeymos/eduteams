import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { DefaultRouteContext } from '@/lib/api-utils';
import { handleApiError, withAuth } from '@/lib/api-utils';
import { getAssignmentExportData } from '@/lib/data/team-export';
import { generateTeamFormationPDF } from '@/lib/export/pdf-generator';
import type { ExtendedUser } from '@/lib/types';
import { HttpError } from '@/lib/utils/errors';

export const GET = withAuth<{ id: string }>(
  async (
    _request: NextRequest,
    context: DefaultRouteContext<{ id: string }> & { user: ExtendedUser }
  ) => {
    try {
      const { id } = await context.params;

      // Fetch export data with authorization check
      const exportData = await getAssignmentExportData(id, context.user.id);

      // Handle various error cases
      if (!exportData) {
        throw new HttpError(
          404,
          'Assignment not found, no teams formed, or unauthorized access'
        );
      }

      // Generate PDF
      const pdfBuffer = await generateTeamFormationPDF(exportData);

      // Create filename with assignment title and date
      const date = new Date().toISOString().split('T')[0];
      const sanitizedTitle = exportData.assignmentTitle
        .replace(/[^a-z0-9]/gi, '-')
        .toLowerCase();
      const filename = `team-formation-${sanitizedTitle}-${date}.pdf`;

      // Return PDF file with proper headers
      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
